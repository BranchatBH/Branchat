// src/content/messaging/router.ts
import type { InboundMsg } from "./types";
import { handlers } from "./handlers";

let installed = false;

export function installMessageRouter(_onRefresh: () => void ) {
  if (installed) return;
  installed = true;

  chrome.runtime.onMessage.addListener((msg: InboundMsg, _sender, sendResponse) => {
    const h = (handlers as any)[msg?.type];
    if (!h) return; 

    const ret = h(msg, sendResponse);
    if (ret && typeof ret.then === "function") return true;
    return;
  });
}

export function uninstallMessageRouter() {
  return;
}
