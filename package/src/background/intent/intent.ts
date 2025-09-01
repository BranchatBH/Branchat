import type {TabId,ChatId, NavIntent} from "../type/types";
import { delay } from "../services/ping";
import { fetchBackground } from "../services/fetch";
import { detectChatUUID, detectProviderFromURL } from "@/utils/detect";
const NAV_INTENT_TTL = 30_000; // 30s; tune as you like
const navIntents = new Map<TabId, NavIntent>();

function newNonce() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

export function setNavIntent(tabId: TabId, parentId : ChatId) {
  navIntents.set(tabId, {
    reason: "SIDE_PANEL_ADD_CHAT",
    nonce: newNonce(),
    parentId, 
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

export async function afterNavigateBranch(tabId: number, _url:string, parentId:ChatId) {
  await delay(500);

  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url;
    const title = tab.title;
    if(url !== _url){
        throw new Error("urls do not match");
    }
    if (url && title) {
        const res = await fetchBackground("/nodes/chat", { body:
            JSON.stringify({
                parentId,
                title, 
                sourceChatId: detectChatUUID(url), 
                sourceAiModel:detectProviderFromURL(url) as string})})
            .catch((err) => {throw new Error(err?.message || "unknown error while fetch")
        });
        return res.ok ? (await res.json()).data : null;

    } else {
      console.log("Missing title or url, will retry...");
    }
  } catch (e) {
    console.error("Error getting tab info:", e);
  }
}