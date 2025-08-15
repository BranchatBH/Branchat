import { BubbleProvider } from "@/providers/BubbleProvider";
import { debounced } from "@/utils/helper";
import { createPortal } from "react-dom";
import { useState, useMemo, useEffect } from "react";
import BubbleButton from "@/components/bubbleButton";

export default function BubbleInjector({dom} : {dom : BubbleProvider}){
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const [active, setActive] = useState<boolean>(false);

    const tick = useMemo(()=>
        debounced(() => {
            console.log(dom.bubbleContainer());
            const selected = dom.hasMeaningfulSelection();
            setActive(selected);
            setContainer(selected ? dom.bubbleContainer() : null);
        }, 60)
    ,[])

    useEffect(() => {
        const onSel = () => tick();
        document.addEventListener("selectionchange", onSel, true);
        document.addEventListener("mouseup", onSel, true);
        document.addEventListener(
        "keyup",
        (e) => {
            if (e.key === "Escape") {
            setActive(false);
            setContainer(null);
            } else {
            tick();
            }
        },
        true
        );

        const mo = new MutationObserver(() => tick());
        mo.observe(document.documentElement, { childList: true, subtree: true });
        let scrollTimer: ReturnType<typeof setTimeout>;
        const onScroll = () => {
            setActive(false);
            setContainer(null);
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => tick(), 120);
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => {
        document.removeEventListener("selectionchange", onSel, true);
        document.removeEventListener("mouseup", onSel, true);
        window.removeEventListener("scroll", onScroll);
        mo.disconnect();
        };
    },[tick])
     if (!active || !container) return null;

    const txt = dom.getSelectedText();

  // Render into their popover so we piggyback on ChatGPT positioning/lifecycle
   return createPortal(<BubbleButton text={txt}/>, container);
};
