export const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

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

async function pingSidePanel(timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), timeoutMs);
    chrome.runtime.sendMessage({ type: 'PING_SIDEPANEL' }, (reply) => {
      clearTimeout(t);
      if (chrome.runtime.lastError) return resolve(false);
      resolve(Boolean(reply?.ready));
    });
  });
}

export async function ensureSidePanel() {
  for (let i = 0; i < 10; i++) {
    if (await pingSidePanel(500)) return;
    await delay(200);
  }
  console.log('timeout');
  throw new Error('SidePanel is not ready');
}

export async function ensureContentScript(tabId: number) {
  // We don't dynamically inject here; just wait for CS to be alive.
  if (await pingContent(tabId)) return;

  for (let i = 0; i < 10; i++) {
    if (await pingContent(tabId, 500)) return;
    await delay(200);
  }
  console.log("timeout");
  throw new Error("Content script not ready");
}

export async function waitForComplete(tabId: number) {
  try {
    const t = await chrome.tabs.get(tabId);
    if (t.status === "complete") return;
  } catch { return; }
  await new Promise<void>((resolve) => {
    const listener = (id: number, info: chrome.tabs.OnUpdatedInfo) => {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}