import {useState, useEffect} from "react"; 
import selectors from "@/constants/selectors";
import { createPortal } from "react-dom";
import "../global.css"
import { Pencil } from "lucide-react";
import { dummyContext } from "@/constants/dummy";

const ContextInjector = () => {
    const [container, setContainer] = useState<(HTMLElement)[]>([]);

    useEffect(() => {
        let isMounted = true;

        const waitForContainer = () : Promise<HTMLElement[]> => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const timeOut = 10000;

                const check = () => {
                    const {chatGPT} = selectors;
                    console.log(chatGPT.inputQuery);
                    const el =  document.querySelectorAll(chatGPT.inputQuery) as NodeListOf<HTMLElement> | null;

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
                        e.insertBefore(ph, e.children[0]);
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
        {container.map((c:HTMLElement) => {
            console.log("injected react")
            return(createPortal(<ContextSummary/>, c));
        })}
        </>
    );
};

const ContextSummary = () => {
    return(
        <div className="mx-auto flex-1
  max-w-[32rem]
  sm:max-w-[40rem]
  md:max-w-[48rem] mx-[1rem] sm:mx-[1.5rem] md:mx-[4rem]">
    <div className="mx-auto bg-trasparent border text-zinc-700 px-2 py-1 items-center text-sm flex-1 max-w-[32rem] sm:max-w-[32rem] md:max-w-[40rem] mb-3 h-24 rounded-md">
        <div className = "flex w-full justify-start gap-x-1">
            <Pencil className="text-white w-5 h-5"/>
            <div>context summary </div>
        </div>
        <div className="w-[90%] border-1 mt-2 h-12 px-1 py-1 mx-auto text-white text-sm rounded-md">
            {dummyContext}
        </div>

    </div>
  </div>
    );
}

export default ContextInjector;