import { createRoot } from "react-dom/client"
import "@/global.css"
import ContextInjector from "@/injectors/chatgpt/contextInjector";
import BranchInjector from "@/injectors/chatgpt/branchInjector";

const url = window.location.href;
if(!url){
        console.log("no url");
    }else{
    if(url.includes('model')){
        console.log("includes model");
        const mount = document.createElement("div");
        mount.id = "my-extension-root";
        document.body.appendChild(mount);
        const root = createRoot(mount);
        root.render(<ContextInjector/>);
    }else{
        const mount = document.createElement("div");
        mount.id = "my-extension-root";
        document.body.appendChild(mount);
        const root = createRoot(mount);
        root.render(<BranchInjector/>);
    }
}
