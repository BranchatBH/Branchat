import { SubmitProvider } from "@/providers/SubmitProvider";
import { Provider } from "@/types/types";

declare global {
  interface Window {
    __myExtBusy?: boolean;
  }
}

export async function fillAndSubmit(prompt: string, provider : Provider | null): Promise<boolean> {
  if(!provider){
    throw new Error("no provider");
  }
  const submitProvider = new SubmitProvider(document, provider);

  if (!prompt?.trim()) {console.log("no prompt");return false;}

  if (window.__myExtBusy) {console.log("window is busy!");return false;}
  window.__myExtBusy = true;

  try {
    const editor = await submitProvider.waitForEditorMount(3000, 120); 

    if (!editor) return false;

    submitProvider.replaceEditorText(prompt);
    
    const btn = await submitProvider.waitForButtonMount(3000,120);

    if (!btn) return false;

    else if (btn.disabled) return false;

    btn.click();
    setTimeout(() => submitProvider.clearEditor(), 50);
    return true;

  } catch(error){
    console.log(error)
    return false;

  } finally {
    window.__myExtBusy = false; // <-- always release
  }
}

