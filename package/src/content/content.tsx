import { createRoot } from "react-dom/client"
import "@/global.css"
import BranchInjector from "@/injectors/chatgpt/branchInjector";
import { fillAndSubmit } from "./fillAndSubmit";

const url = window.location.href;
if(!url){
        console.log("no url");
    }else{
    if(url.includes('model')){
        console.log("includes model");
        const mount = document.createElement("div");
        mount.id = "extension-Branchat";
        document.body.appendChild(mount);
        const root = createRoot(mount);
        root.render(<div/>);

    }else{
        const mount = document.createElement("div");
        mount.id = "extension-Branchat";
        document.body.appendChild(mount);
        const root = createRoot(mount);
        root.render(<BranchInjector/>);
    }
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
      const ok = await fillAndSubmit(msg.prompt ?? "");
      sendResponse({ success: ok });
      return true;
    } catch (e) {
      sendResponse({ success: false, error: String(e) });
      return false;
    }
    return true;
  }
});
