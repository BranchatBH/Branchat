import { createRoot, type Root } from "react-dom/client";
import { ensureMount } from "./dom/ensureMount";
import { installErrorListeners, uninstallErrorListeners } from "@/content/errors/listeners";
import { installMessageRouter, uninstallMessageRouter } from "@/content/messaging/router";
import { DomProvider } from "@/content/providers/DomProvider";
import { BubbleProvider } from "./providers/BubbleProvider";
import BranchInjector from "./injectors/branchInjector";
import BubbleInjector from "./injectors/bubbleInjector";
import { detectInChat, detectProviderFromLocation } from "@/utils/detect";
import type { Provider } from "@/types/types";


let root: Root | null = null;
let installed = false;

export function Render() {
  const provider: Provider | null = detectProviderFromLocation(window.location);
  if (!provider) return;

  const { mountEl } = ensureMount();
  if (!root) root = createRoot(mountEl);

  const inChat = detectInChat(window.location.href);
  const dom = new DomProvider(document, provider);
  const bubbleDom = new BubbleProvider(document, provider);

  root.render(inChat ? (
    <>
      <BranchInjector dom={dom} />
      <BubbleInjector dom={bubbleDom} />
    </>
  ) : null);
}

export function Init(){
    if(installed) return;
    installed = true;

    installErrorListeners();
    installMessageRouter(Render);

    Render();

    window.addEventListener("beforeunload", StopContent, { once: true });
}


export function StopContent() {
  uninstallMessageRouter();
  uninstallErrorListeners();

  try { root?.unmount(); } catch{}
  root = null;
  installed = false;
}