import { createRoot } from "react-dom/client"
import "@/global.css"
import BranchInjector from "@/injectors/chatgpt/branchInjector";
import { fillAndSubmit } from "./fillAndSubmit";
import { DomProvider } from "@/providers/DomProvider";
import { detectProviderFromLocation, detectInChat} from "@/utils/detect";
import type { Provider } from "@/types/types";

const url = window.location.href;
const provider : Provider | null = detectProviderFromLocation(window.location);

const inChat : Boolean = detectInChat(url);

if(!provider) {
    console.log("no url");
} else {
    const dom = new DomProvider(document,provider);
    const mount = document.createElement("div");
    mount.id = "extension-Branchat";
    document.body.appendChild(mount);
    const root = createRoot(mount);
    root.render(inChat ? <BranchInjector dom = {dom}/> : <div/>)
}

console.log("add listener");

chrome.runtime.onMessage.addListener(async (msg, _sender, sendResponse) => {
  if(msg?.type === "PING"){
    console.log("ready");
    sendResponse({ready : true});
  }

  if (msg?.type === "RUN_FILL_AND_SUBMIT") {
    console.log("got message");
    try {
      const ok = await fillAndSubmit(msg.prompt ?? "", provider);
      sendResponse({ success: ok });
      return true;
    } catch (e) {
      sendResponse({ success: false, error: String(e) });
      return false;
    }
  }
});

