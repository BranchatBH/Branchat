import { useState, useEffect, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import "../global.css";
import { Pencil } from "lucide-react";
import selectors from "@/constants/selectors";
import { dummyContext } from "@/constants/dummy";
import { getEditorEl, prependToProseMirror, findSendButton} from "@/utils/helper";
interface Elements {
  elList: HTMLElement[];
  formEl: HTMLFormElement;
  editorEl: HTMLDivElement;
}

const ContextInjector = () => {
  const [containers, setContainers] = useState<HTMLElement[]>([]);
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const [editor, setEditor] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const waitForContainer = (): Promise<Elements> =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        const timeout = 10000;

        const check = () => {
          const { chatGPT } = selectors as any;

          const elList =
            (document.querySelectorAll(chatGPT?.inputSectionQuery) as NodeListOf<HTMLElement>) ||
            (document.querySelectorAll("[data-type='unified-composer']") as NodeListOf<HTMLElement>);

          const formEl =
            (document.querySelector(chatGPT?.formQuery) as HTMLFormElement) ||
            (document.querySelector("form[data-type='unified-composer']") as HTMLFormElement);

          const editorEl =
            (document.querySelector(
              "#prompt-textarea.ProseMirror[contenteditable='true']"
            ) as HTMLDivElement) ||
            (document.querySelector(".ProseMirror[contenteditable='true']") as HTMLDivElement);

          if (elList && elList.length > 0 && formEl && editorEl) {
            resolve({ elList: [...elList], formEl, editorEl });
          } else if (Date.now() - start > timeout) {
            reject(new Error("Timeout: required elements not found"));
          } else {
            setTimeout(check, 300);
          }
        };

        check();
      });

    const run = async () => {
      try {
        const { elList, formEl, editorEl } = await waitForContainer();

        const placeholders = elList.flatMap((e: HTMLElement) => {
          if (!isMounted || !e.parentNode) return [];
          const parent = e.parentNode as HTMLElement;
          const ph = document.createElement("div");
          // Safer insert: before index 1 if exists, else append
          if (parent.children[1]) parent.insertBefore(ph, parent.children[1]);
          else parent.appendChild(ph);
          return ph;
        });

        if (!isMounted) return;
        setContainers(placeholders);
        setForm(formEl);
        setEditor(editorEl);
      } catch (err) {
        console.error(err);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, []);

  if (containers.length === 0 || !form || !editor) return null;

  return (
    <>
      {containers.map((c, idx) =>
        createPortal(<ContextSummary key={idx} form={form} />, c)
      )}
    </>
  );
};

const ContextSummary = ({ form }: { form: HTMLFormElement }) => {
  const [context, setContext] = useState<string>(dummyContext);

  // Intercept Enter/Cmd+Enter and trailing send-button click (capture phase)
  useEffect(() => {
    if (!form) return;

    let reentering = false;

    const triggerSend = () => {
      const btn = findSendButton(form) || findSendButton(document);
      if (!btn) return;
      reentering = true;
      setTimeout(() => {
        try {
          btn.click();
        } finally {
          reentering = false;
        }
      }, 0);
    };

    const onKeyDownCapture = (e: KeyboardEvent) => {
      if (reentering) return;

      const editor = getEditorEl();
      const active = document.activeElement as Element | null;
      const inEditor = editor && (active === editor || (active && editor.contains(active)));

      const isEnter = e.key === "Enter";
      const submitCombo =
        (isEnter && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) ||
        (isEnter && (e.metaKey || e.ctrlKey));

      if (inEditor && submitCombo) {
        e.preventDefault();
        e.stopPropagation();
        (e as any).stopImmediatePropagation?.();

        prependToProseMirror(context);
        triggerSend();
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (reentering) return;

      const btn = findSendButton(form) || findSendButton(document);
      if (!btn) return;

      const path =
        (typeof (e as any).composedPath === "function" ? (e as any).composedPath() : []) as Element[];
      const clickedSend =
        path.includes(btn) ||
        (e.target && (btn === e.target || btn.contains(e.target as Node)));

      if (clickedSend) {
        e.preventDefault();
        e.stopPropagation();
        (e as any).stopImmediatePropagation?.();

        prependToProseMirror(context);
        triggerSend();
      }
    };

    window.addEventListener("keydown", onKeyDownCapture, true);
    document.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("keydown", onKeyDownCapture, true);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [form, context]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContext(e.target.value);
  };

  return (
    <div className="w-full cursor-default h-full z-24 pt-5">
      <div className="mb-2 relative min-h-18 min-w-0 max-w-[90%] mx-auto p-2 pb-2 rounded-lg bg-[#212121] border-1 border-gray-700 text-gray-400 text-md">
        <div className="flex flex-col h-full w-full flex-1 items-center"></div>
        <div className="w-full justify-between flex flex-row mb-2 items-center">
          <span>Context Summary</span>
          <Pencil className="text-black h-5 w-5" />
        </div>
        <form id="context-textarea" onSubmit={(e) => e.preventDefault()}>
          <div>
            <textarea
              name="contextInput"
              className="border bg-transparent cursor-text h-24 overflow-y-auto border-dashed bg-[#2e2e32] w-full p-2 text-wrap rounded-lg break-words whitespace-normal"
              value={context}
              onChange={handleChange}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContextInjector;
