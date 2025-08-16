type TabId = number;
const CONTENT_FILE = "src/content/content.tsx.js"; // built file path
let currentTabId: TabId | null = null;

// Track tab activation
chrome.tabs.onActivated.addListener(({ tabId }) => {
  currentTabId = tabId;
});

chrome.windows.onFocusChanged.addListener(async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  currentTabId = tab?.id ?? null;
});

chrome.sidePanel.setPanelBehavior({openPanelOnActionClick : true})
    .catch((error) => console.log(error));

const debounceTimers = new Map<TabId, number>();
function debounce(tabId: number, fn: () => void, delay = 200) {
  const old = debounceTimers.get(tabId);
  if (old) clearTimeout(old);
  const t = setTimeout(fn, delay) as unknown as number;
  debounceTimers.set(tabId, t);
}

// Reusable helpers
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function pingContent(tabId: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), timeoutMs);
    chrome.tabs.sendMessage(tabId, { type: "PING" }, (reply) => {
      clearTimeout(t);
      if (chrome.runtime.lastError) return resolve(false);
      resolve(Boolean(reply?.ready));
    });
  });
}

async function ensureContentScript(tabId: number) {
  // already there?
  if (await pingContent(tabId)) return;

  // inject built JS
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [CONTENT_FILE],
  });

  // give it a moment to boot
  for (let i = 0; i < 6; i++) {
    if (await pingContent(tabId)) return;
    await delay(200);
  }
  console.log("timeout")
  throw new Error("Content script not ready after injection");
}

// Optional: wait for 'complete' status (useful on hard loads; SPA often already 'complete')
async function waitForComplete(tabId: number) {
  try {
    const t = await chrome.tabs.get(tabId);
    if (t.status === "complete") return;
  } catch { return; }
  await new Promise<void>((resolve) => {
    const listener = (id: number, info: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// ---- NAV LISTENERS ----
// 1) SPA route changes (most important)
chrome.webNavigation.onHistoryStateUpdated.addListener(({ tabId, url }) => {
  // Filter to your domains
  if (!/https?:\/\/(www\.)?chatgpt\.com/.test(url)) {
    console.log("wrongurl");
    return;
  }

  debounce(tabId, async () => {
    try {
      await ensureContentScript(tabId);
      console.log("post_navigate");
      chrome.tabs.sendMessage(tabId, { type: "POST_NAVIGATE" });
    } catch (e) {
      console.log(e);
    }
  }, 150);
}, { url: [{ hostSuffix: "chatgpt.com" }] });

// 2) Normal navigations (initial hard loads, redirects, etc.)
chrome.webNavigation.onCommitted.addListener(async ({ tabId, url, frameId }) => {
  if (frameId !== 0) return; // top frame only
  if (!/https?:\/\/(www\.)?chatgpt\.com/.test(url)) return;

  debounce(tabId, async () => {
    try {
      await waitForComplete(tabId);
      await ensureContentScript(tabId);
      console.log("post_navigate");
      chrome.tabs.sendMessage(tabId, { type: "POST_NAVIGATE" });
    } catch(e) {console.log(e);}
  }, 150);
}, { url: [{ hostSuffix: "chatgpt.com" }] });

// Example: public API your UI can call
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'SELECTION') {
    const tabId = currentTabId
    console.log("heard from background:", msg.text);
    if (!tabId) return; 

    chrome.runtime.sendMessage({
      type: 'SELECTION_RELAY',
      text: msg.text,
      tabId,
    });
    sendResponse({ ok: true });
  // Keep channel open only if using async; here we don't:
    return true;
  }
  if (msg?.type === "NAVIGATE") {
    console.log("got message");
    (async () => {
      const tabId = currentTabId;
      console.log(tabId);
      if (!tabId) return sendResponse({ success: false });

      try {
        await chrome.tabs.update(tabId, { url: msg.url });
        console.log(tabId);
        await waitForComplete(tabId);
        await ensureContentScript(tabId);
        console.log("content script loaded");
        chrome.tabs.sendMessage(tabId, { type: "RUN_FILL_AND_SUBMIT", prompt: msg.prompt ?? "" }, (res:any) => {
          if (chrome.runtime.lastError) return sendResponse({ success: false });
          sendResponse(res ?? { success: false });
        });
      } catch (e) {
        console.log(e);
        sendResponse({ success: false, error: String(e) });
      }
    })();
    return true; // keep channel open
  }
});
