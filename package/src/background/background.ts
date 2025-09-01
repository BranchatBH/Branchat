import { detectInChat, detectProviderFromURL } from "@/utils/detect";
import { broadcastUrl } from "./services/broadcastUrl";
import type { TabId } from "./type/types";
import { debounce } from "./services/debounce";
import { ensureContentScript, ensureSidePanel, waitForComplete } from "./services/ping";
import {setNavIntent, consumeIntent, afterNavigateBranch} from "./intent/intent";

let currentTabId: TabId | null = null;


chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  currentTabId = tabId;
  await broadcastUrl(tabId).catch(() => {});
});

chrome.windows.onFocusChanged.addListener(async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  currentTabId = tab?.id ?? null;
  if (tab?.id) await broadcastUrl(tab.id).catch(() => {});
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.log(error));

chrome.webNavigation.onHistoryStateUpdated.addListener(({ tabId, url }) => {
  if (!detectProviderFromURL(url)) return;

  debounce(tabId, async () => {
    try {
      await ensureContentScript(tabId);

      // Always tell CS to (re)render your UI
      chrome.tabs.sendMessage(tabId, { type: "POST_NAVIGATE" });
      await broadcastUrl(tabId, url);

      // If this URL *is* a conversation, check if it was ours
      if (detectInChat(url)) {
        const intent = consumeIntent(tabId); // single-use
        if (intent) {
          // This conversation page came from our sidepanel submit
          await afterNavigateBranch(tabId, url, intent.parentId);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, 150);
}, { url: [{ hostSuffix: "chatgpt.com" }] });

chrome.webNavigation.onCommitted.addListener(({ tabId, url, frameId }) => {
  if (frameId !== 0) return; // top frame only
  if (!detectProviderFromURL(url)) return;

  debounce(tabId, async () => {
    try {
      await waitForComplete(tabId);
      await ensureContentScript(tabId);

      chrome.tabs.sendMessage(tabId, { type: "POST_NAVIGATE" });
      await broadcastUrl(tabId, url);

      if (detectInChat(url)) {
        const intent = consumeIntent(tabId);
        if (intent) {
          await afterNavigateBranch(tabId, url, intent.parentId);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, 150);
}, { url: [{ hostSuffix: "chatgpt.com" }] });

// ========= 8) Messages from sidepanel & CS =========
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // Sidepanel selection relay (kept as you had it)
  if (msg?.type === 'SELECTION') {
    (async () => {
      const tabId = currentTabId;
      if (!tabId) { console.log('no tabId'); sendResponse({ ok: false }); return; }
      try {
        await ensureSidePanel();
        await chrome.runtime.sendMessage({
          type: 'SELECTION_RELAY',
          text: msg.text,
          tabId,
        });
        sendResponse({ ok: true });
      } catch (err) {
        console.log(err);
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true;
  }

  // Explicitly open sidepanel
  if (msg?.type === "OPEN_SIDEPANEL") {
    const tabId = currentTabId;
    if (!tabId) { console.log("no tabID"); sendResponse({ success: false }); return; }
    try {
      chrome.sidePanel.open({ tabId }, () => {
        sendResponse({ success: true });
      });
    } catch (error) {
      sendResponse({ success: false, error });
      console.log(error);
    }
    return true;
  }

  // *** IMPORTANT: Sidepanel's "Add Chat" button sends NAVIGATE { url, prompt } ***
  if (msg?.type === "NAVIGATE") {
    (async () => {
      const tabId = currentTabId;
      if (!tabId) return sendResponse({ success: false, error: "No active tab" });
      try {
        setNavIntent(tabId, msg.parentId ?? '');

        await chrome.tabs.update(tabId, { url: msg.url });

        await waitForComplete(tabId);
        await ensureContentScript(tabId);

        chrome.tabs.sendMessage(
          tabId,
          { type: "RUN_FILL_AND_SUBMIT", prompt: msg.prompt ?? "" },
          (res: any) => {
            if (chrome.runtime.lastError) return sendResponse({ success: false });
            sendResponse(res ?? { success: true });
          }
        );
      } catch (e) {
        console.log(e);
        sendResponse({ success: false, error: String(e) });
      }
    })();
    return true;
  }
});

self.addEventListener("error", (e: any) => {
  console.error("SW ErrorEvent:", e?.error || e?.message || e);
});
self.addEventListener("unhandledrejection", (e: any) => {
  console.error("SW UnhandledRejection:", e?.reason);
});
