import { findAllByTag } from "@/utils/helper";
import { DomProvider } from "./DomProvider"
import type { Provider } from "@/types/types";
import config from "@/config/config";
 
export class BubbleProvider extends DomProvider{
    constructor(
        root : Document | HTMLElement,
        p: Provider
    ){
        super(root,p);
    }

    bubbleContainer(root:Document | HTMLElement = this.root){
        //onsole.log(this.s.askBubbleQ[0]);
        const els = findAllByTag<HTMLElement>(root, this.s.askBubbleQ[0])
        if(!els) return null;
        for(const el of els){
            const hasButton = !!el.querySelector('button');
            if (hasButton && getComputedStyle(el).position === 'absolute') {
                return el;
            }
        }
        return null;
    }

    getSelectedText(): string {
        const sel = window.getSelection?.();
        if (!sel || sel.isCollapsed) return "";
        const text = sel.toString().trim();
        return text.length >= 3 ? text : "";
    }

    hasMeaningfulSelection(min = config.MIN_CHARS): boolean {
        const sel = window.getSelection?.()
        if (!sel || sel.isCollapsed) return false;
        //console.log("length":sel.toString().trim().length);
        //console.log("min:", min)
        //console.log(sel.toString().trim().length >= min)
        //console.log(sel.isCollapsed);
        return sel.toString().trim().length >= min;
    }

}