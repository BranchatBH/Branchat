import selectors from "@/constants/selectors";
import { findSendButton, getEditorEl } from "../utils/helper";

declare global {
  interface Window {
    __myExtBusy?: boolean;
  }
}

export async function fillAndSubmit(prompt: string): Promise<boolean> {
  console.log("fillAndSubmit called: ", prompt);
  if (!prompt?.trim()) return false;

  if (window.__myExtBusy) return false;
  window.__myExtBusy = true;

  try {
    const editor = await waitForEditorMount(3000, 120); 
    if (!editor) return false;
    replaceEditorText(editor, prompt);
    
    const btn = await waitForButtonMount(3000,120);
    if (!btn) return false;
    else if (btn.disabled) return false;
    btn.click();
    setTimeout(() => clearEditor(editor), 50);

    return true;
  } catch(error){
    console.log(error)
    return false;
  } finally {
    window.__myExtBusy = false; // <-- always release
  }
}

function clearEditor(editor: HTMLElement) {
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


function replaceEditorText(editor: HTMLDivElement, text: string) {
  editor.focus();

  // 1) Select all
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
/**
 * Polls for both the send button and the editor.
 * Returns [button|null, editor|null] or [null,null] on timeout.
 */
function waitForEditorMount(
  timeoutMs = 3000,
  intervalMs = 100
): Promise<HTMLDivElement | null> {
  const start = Date.now();

  return new Promise((resolve) => {
    const tick = () => {
      const editor = getEditorEl();

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

function waitForButtonMount(timeoutMs = 3000, intervalMs = 100) : Promise<HTMLButtonElement | null>{ 
  const start = Date.now();

  return new Promise((resolve) => {
    const tick = () => {
      const form = document.querySelector(selectors.chatGPT.formQuery) as HTMLFormElement | null;
      const btn = findSendButton(form ?? document);

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