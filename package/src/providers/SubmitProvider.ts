import { DomProvider } from "./DomProvider";
import type { Provider, SelectorSet } from "@/types/types";

export class SubmitProvider extends DomProvider{
    constructor(
        root : Document | HTMLElement,
        p : Provider
    ){
        super(root, p);
    }

    clearEditor() {
        const editor = this.editor() as HTMLDivElement | null;
        if(!editor){
            throw new Error("no editor")
        };
        editor.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        sel?.removeAllRanges();
        sel?.addRange(range);

        const delEvt = new InputEvent("beforeinput", {
            inputType: "deleteByCut",
            data: null,
            bubbles: true,
            cancelable: true,
            composed: true
        });
        const accepted = editor.dispatchEvent(delEvt);

        if (!accepted) {
            document.execCommand("delete", false);
            if ((editor.textContent ?? "").length) {
            document.execCommand("selectAll", false);
            document.execCommand("delete", false);
            }
        }
    }

    replaceEditorText(text: string) {
        const editor = this.editor() as HTMLDivElement | null
        if(!editor){
            throw new Error("no editor");
        }
        editor.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        sel?.removeAllRanges();
        sel?.addRange(range);

        // 2) Clear via beforeinput (lets the editor update internal state)
        const delEvt = new InputEvent("beforeinput", {
            inputType: "deleteByCut",
            data: null,
            bubbles: true,
            cancelable: true,
            composed: true
        });
        editor.dispatchEvent(delEvt);

        // 3) Insert via beforeinput (single trailing newline to “press enter” look, optional)
        const insEvt = new InputEvent("beforeinput", {
            inputType: "insertText",
            data: text,
            bubbles: true,
            cancelable: true,
            composed: true
        });
        const accepted = editor.dispatchEvent(insEvt);

        // 4) Fallback if the editor ignored beforeinput
        if (!accepted || (editor.textContent ?? "").trim() !== text.trim()) {
            document.execCommand("selectAll", false);
            document.execCommand("insertText", false, text);
        }
    }

    waitForEditorMount(timeoutMs = 3000, intervalMs = 100): Promise<HTMLDivElement | null> {
        const start = Date.now();
        
        return new Promise((resolve) => {
            const tick = () => {
            const editor = this.editor();

            if (editor) {
                resolve(editor);
                return;
            }

            if (Date.now() - start > timeoutMs) {
                console.log("timeout");
                resolve(editor ?? null); // return what we have (likely nulls)
                return;
            }
            setTimeout(tick, intervalMs);
            };
            tick();
        });
    }

    waitForButtonMount(timeoutMs = 3000, intervalMs = 100) : Promise<HTMLButtonElement | null>{ 
        const start = Date.now();

        return new Promise((resolve) => {
            const tick = () => {
            const form = this.form();
            const btn = this.submitButton(form ?? document);

            if (btn) {
                resolve(btn);
                return;
            }
            if (Date.now() - start > timeoutMs) {
                console.log("timeout");
                resolve(btn ?? null); // return what we have (likely nulls)
                return;
            }
            setTimeout(tick, intervalMs);
            };
            tick();
        });
    }
}