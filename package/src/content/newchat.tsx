import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client"
import selectors from "@/constants/selectors";
import NewChatWindow from "@/components/newChatWindow";

const ContainerInjector = () => {
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        let isMounted = true;

        const waitForContainer = () : Promise<HTMLElement> => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const timeOut = 10000;

                const check = () => {
                    const query = selectors.chatGPT;
                    const el = document.querySelector(query) as HTMLElement | null;

                    if(el){
                        console.log("found element");
                        resolve(el);

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
                if (isMounted) {
                    const style = window.getComputedStyle(res);
                    if(style.position === 'static'){
                        style.position = 'relative';
                    }
                    setContainer(res);
                }

            }catch(err){
                console.log(err);
            }
        }

        run();

        return () => {
            isMounted = false;
        }
    },[]);

    if(!container){return null;}

    return(
        createPortal(<NewChatWindow/>, container)
    );
};

const mount = document.createElement("div");
mount.id = "my-extension-root";
document.body.appendChild(mount);

// Mount the React app
const root = createRoot(mount);
root.render(<ContainerInjector />);

export default ContainerInjector;