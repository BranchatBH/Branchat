import { createRoot } from "react-dom/client";
import "@/global.css";
import BranchInjector from "@/injectors/chatgpt/branchInjector";
import { fillAndSubmit } from "./fillAndSubmit";
import { DomProvider } from "@/providers/DomProvider";
import { detectProviderFromLocation, detectInChat } from "@/utils/detect";
import type { Provider } from "@/types/types";
import { BubbleProvider } from "@/providers/BubbleProvider";
import BubbleInjector from "@/injectors/chatgpt/bubbleInjector";

let reactRoot: ReturnType<typeof createRoot> | null = null;

function mount(forceRemount = false) {
  const url = window.location.href;
  const provider: Provider | null = detectProviderFromLocation(window.location);
  const inChat: boolean = detectInChat(url);
  if (!provider) return;

  let mountEl = document.getElementById("extension-Branchat");
  if (!mountEl) {
    mountEl = document.createElement("div");
    mountEl.id = "extension-Branchat";
    document.body.appendChild(mountEl);
  }
  if (!reactRoot || forceRemount) {
    reactRoot = createRoot(mountEl);
  }
  const dom = new DomProvider(document, provider);
  const bubbleDom = new BubbleProvider(document, provider);
  reactRoot.render(inChat ?  <>
        <BranchInjector dom={dom} />
        <BubbleInjector dom={bubbleDom} />
      </>: <></>);
}

mount();

chrome.runtime.onMessage.addListener(async (msg, _sender, sendResponse) => {
  if (msg?.type === "PING") {
    sendResponse({ ready: true });
  }

  if (msg?.type === "RUN_FILL_AND_SUBMIT") {
    try {
      const provider: Provider | null = detectProviderFromLocation(window.location);
      const ok = await fillAndSubmit(msg.prompt ?? "", provider);
      // After navigation or UI changes, just re-render React
      mount(true);
      sendResponse({ success: ok });
      return true;
    } catch (e) {
      sendResponse({ success: false, error: String(e) });
      return false;
    }
  }
});
