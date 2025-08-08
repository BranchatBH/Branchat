import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client"
import selectors from "@/constants/selectors";
import NewChatButton from "@/components/newChatButton";
import "@/global.css"
import ContextInjector from "@/components/contextSummary";

const ContainerInjector = () => {
    const [container, setContainer] = useState<(HTMLElement)[]>([]);

    useEffect(() => {
        let isMounted = true;

        const waitForContainer = () : Promise<HTMLElement[]> => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const timeOut = 10000;

                const check = () => {
                    const {chatGPT} = selectors;
                    const el =  document.querySelectorAll(chatGPT.buttonQuery) as NodeListOf<HTMLElement> | null;

                    if(el && el.length > 0){
                        console.log("found elements:", el.length);
                        resolve([...el]);

                    }else if(Date.now() - startTime > timeOut){
                        reject(new Error("timeout"));

                    }else{
                        setTimeout(check, 500);
                    }
                };

                check();
            });
        }
        
        const run = async () => {
            try{
                const res = await waitForContainer();
                const containers = res.flatMap((e:HTMLElement) => {
                    if (isMounted && e.hasChildNodes()) {
                    
                        const ph = document.createElement('div');
                        e.appendChild(ph);
                        console.log("appended")
                    return ph;
                    }
                    else{
                        return [];
                    }
                })
                setContainer(containers);
            }catch(err){
                console.log(err);
            }
        }

        run();

        return () => {
            isMounted = false;
        }
    },[]);

    if(container.length === 0){return null;}

    return(
        <>
        {container.map((c:HTMLElement, idx:number) => {
            console.log("injected react")
            return(createPortal(<NewChatButton id={idx}/>, c));
        })}
        </>
    );
};
/** 
async function getURL() {return chrome.tabs.query({ active: true, currentWindow: true })
  .then(tabs => (tabs[0]?.url)).catch((error) => {throw new Error(error)});
}

getURL().then((url)=>{
    if(!url){
        console.log("no url");
    }
    else{
        if(url.includes('model')){
            const mount = document.createElement("div");
            mount.id = "my-extension-root";
            document.body.appendChild(mount);
            const root = createRoot(mount);
            root.render(<ContainerInjector />);
        }else{
            const mount = document.createElement("div");
            mount.id = "my-extension-root";
            document.body.appendChild(mount);
            const root = createRoot(mount);
            root.render(<div/>);
        }
    }
}).catch((error)=>console.log(error));
*/

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
        root.render(<ContainerInjector/>);
    }
}

export default ContainerInjector;