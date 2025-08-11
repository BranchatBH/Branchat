import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import selectors from "@/constants/selectors";
import NewChatButton from "@/components/newChatButton";
import "@/global.css"

const BranchInjector = () => {
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

export default BranchInjector;