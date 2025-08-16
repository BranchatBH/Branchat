import { createRoot } from "react-dom/client";
import "@/global.css";
import BranchInjector from "@/injectors/chatgpt/branchInjector";
import { fillAndSubmit } from "./fillAndSubmit";
import { DomProvider } from "@/providers/DomProvider";
import { detectProviderFromLocation, detectInChat } from "@/utils/detect";
import type { Provider } from "@/types/types";
import { BubbleProvider } from "@/providers/BubbleProvider";
import BubbleInjector from "@/injectors/chatgpt/bubbleInjector";

// ---- globals (guards) ----
declare global {
  interface Window {
    __branchatRoot?: ReturnType<typeof createRoot> | null;
    __branchatMountEl?: HTMLElement | null;
    __branchatMsgListener?: boolean;
  }
}

let reactRoot: ReturnType<typeof createRoot> | null = window.__branchatRoot ?? null;

// ---- ensure mount node ----
function ensureMountEl(): HTMLElement {
  let mountEl =
    window.__branchatMountEl ?? document.getElementById("extension-Branchat");
  if (!mountEl) {
    mountEl = document.createElement("div");
    mountEl.id = "extension-Branchat";
    mountEl.setAttribute("data-branchat-root", ""); // debug/guard
    document.body.appendChild(mountEl);
  }
  window.__branchatMountEl = mountEl;
  return mountEl;
}

// ---- (re)mount entrypoint ----
function mountOrRefresh(forceRemount = false) {
  const url = window.location.href;
  console.log("mountOrRefresh on:", url);

  const provider: Provider | null = detectProviderFromLocation(window.location);
  const inChat: boolean = detectInChat(url);
  if (!provider) return;

  const mountEl = ensureMountEl();

  // Create root once; only hard reset if you *must* rebuild the tree
  if (!reactRoot) {
    reactRoot = createRoot(mountEl);
    window.__branchatRoot = reactRoot;
  } else if (forceRemount) {
    reactRoot.unmount();
    reactRoot = createRoot(mountEl);
    window.__branchatRoot = reactRoot;
  }

  const dom = new DomProvider(document, provider);
  const bubbleDom = new BubbleProvider(document, provider);

  reactRoot.render(
    inChat ? (
      <>
        <BranchInjector dom={dom} />
        <BubbleInjector dom={bubbleDom} />
      </>
    ) : null
  );
}

// initial boot
mountOrRefresh(false);

// ---- messaging ----
if (!window.__branchatMsgListener) {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    // health check
    if (msg?.type === "PING") {
      console.log("PING -> ready");
      sendResponse({ ready: true });
      return; // sync
    }

    // SPA route change "nudge" from background
    if (msg?.type === "POST_NAVIGATE") {
      console.log("POST_NAVIGATE -> refresh");
      mountOrRefresh(false);
      sendResponse({ ok: true });
      return; // sync
    }

    // Fill composer & click send
    if (msg?.type === "RUN_FILL_AND_SUBMIT") {
      console.log("RUN_FILL_AND_SUBMIT -> start");
      (async () => {
        try {
          const provider: Provider | null = detectProviderFromLocation(window.location);
          const ok = await fillAndSubmit(msg.prompt ?? "", provider);

          // Re-render to ensure any per-turn UI updates
          mountOrRefresh(false);

          sendResponse({ success: ok });
        } catch (e) {
          console.log(e);
          sendResponse({ success: false, error: String(e) });
        }
      })();
      return true; // keep channel open for the async sendResponse above
    }

    // default: ignore
    return;
  });

  window.__branchatMsgListener = true;
}

// ---- cleanup on full unload ----
window.addEventListener("beforeunload", () => {
  try {
    reactRoot?.unmount();
  } catch {}
  window.__branchatRoot = null;
  window.__branchatMountEl = null;
});
