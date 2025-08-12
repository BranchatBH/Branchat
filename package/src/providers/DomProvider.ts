import type { Provider, SelectorSet } from "@/types/types";
import { SELECTORS } from "@/constants/selectors";
import { findByTags, findAllByTag} from "@/utils/helper";

export class DomProvider { 
    s : SelectorSet
    
    constructor(
        protected root : Document | HTMLElement = document,
        protected p : Provider
    ){
        this.s = SELECTORS[this.p];
    }

    submitButton(root : Document | HTMLElement = this.root){return findByTags<HTMLButtonElement>(root, this.s.submitButtonQ);}
    form(){return findByTags<HTMLFormElement>(this.root, this.s.formQ);}
    editor(){return findByTags<HTMLDivElement>(this.root, this.s.editorQ);}
    branchButtons(){return findAllByTag<HTMLButtonElement>(this.root, this.s.branchButtonQ[0]);}

};