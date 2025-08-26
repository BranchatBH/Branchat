import type {TabId, NavIntent} from "../type/types";
import { delay } from "../utils/ping";

const NAV_INTENT_TTL = 30_000; // 30s; tune as you like
const navIntents = new Map<TabId, NavIntent>();

function newNonce() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

export function setNavIntent(tabId: TabId) {
  navIntents.set(tabId, {
    reason: "SIDE_PANEL_ADD_CHAT",
    nonce: newNonce(),
    deadline: Date.now() + NAV_INTENT_TTL,
  });
}

function peekIntent(tabId: TabId): NavIntent | null {
  const i = navIntents.get(tabId);
  if (!i) return null;
  if (Date.now() > i.deadline) { navIntents.delete(tabId); return null; }
  return i;
}

export function consumeIntent(tabId: TabId): NavIntent | null {
  const i = peekIntent(tabId);
  if (!i) return null;
  navIntents.delete(tabId);
  return i;
}

// After we know the nav was ours, gather context and call backend.
export async function afterNavigateBranch(tabId: number, _url:string) {
  // wait a little bit to let ChatGPT set the title
  await delay(500);

  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url;
    const title = tab.title;
    if(url !== _url){
        throw new Error("urls do not match");
    }
    if (url && title) {
      // TODO: call your backend API here
      console.log("Branch API payload:", { url, title });
    } else {
      console.log("Missing url or title, will retry...");
      // optional: retry a couple of times if you want
    }
  } catch (e) {
    console.error("Error getting tab info:", e);
  }
}