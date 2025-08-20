import React ,{useState, useEffect} from "react";
import { CornerDownRight } from "lucide-react";
import { createPortal } from "react-dom";
import "@/global.css"; // <-- Tailwind entry (see #3)

function PortalBottom({ children }: { children: React.ReactNode }) {
  const [host] = React.useState(() => document.createElement("div"));
  React.useEffect(() => {
    document.body.appendChild(host);
    return () => { document.body.removeChild(host); };
  }, [host]);
  return createPortal(children, host);
}

function SidePanel() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [text, setText] = useState<string>('');

  useEffect(() => {
    let disposed = false;

    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!disposed) setActiveTabId(tab?.id ?? null);
    })();

    const handler = (msg: any, sender: any, sendResponse: (x: any) => void) => {
      if (msg?.type === 'PING_SIDEPANEL') {
        console.log("PING_SIDEPANEL -> READY");
        sendResponse({ ready: true }); 
        return;
      }
      if (msg?.type === 'SELECTION_RELAY') {
        if (activeTabId == null || msg.tabId !== activeTabId) {
          console.log('wrong tab:', msg.tabId, activeTabId);
          return;
        }
        console.log('msg.text:', msg.text);
        setText(msg.text);
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => {
      disposed = true;
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, [activeTabId]);


  function handleSubmit(prompt : string, url : string){
    setLoading(true);
    const concat = text + prompt; 
    console.log(concat);
    chrome.runtime.sendMessage({type : "NAVIGATE", prompt:concat, url}).then(() => setLoading(false))
        .catch((err) => console.log(err));
    console.log("navigate");
  }  

  return (
    <div className="min-h-full h-screen relative bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* your page content */}
      <div className="p-6 text-zinc-800 dark:text-zinc-200">
        <h1 className="text-2xl font-semibold">Hello 👋</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This is the side panel body. Scroll if needed.
        </p>
        <div className="h-[60vh]" />
      </div>

      {/* bottom composer – portaled to <body> so parent transforms/overflow can’t trap it */}
      <PortalBottom>
        <div className="fixed inset-x-0 bottom-6 mx-auto w-[min(900px,95vw)] z-[2147483647]">
          <div className="rounded-2xl relative border border-white/10 bg-zinc-900/80 text-zinc-100
                          shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl p-3">
            {/* header row */}
            {text ? (
                <div className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-zinc-200">
                    <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center">
                        <div className="flex items-center px-1 py-1 text-xs">
                        <CornerDownRight width={14} height={14} />
                        </div>
                        <div className="ml-2 truncate text-sm text-zinc-400">
                        {text}
                        </div>
                    </div>
                    </div>

                    {/* close button */}
                    <button
                    className="absolute top-0 right-0 m-1 flex h-5 w-5 items-center justify-center 
                                rounded-full bg-zinc-900 text-white text-xs hover:cursor-pointer 
                                active:opacity-80"
                    onClick={()=>setText('')}
                    >
                    ×
                    </button>
                </div>
                ) : null}
            {/* textarea */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="무엇이든 물어보세요, @ 모델, / 프롬프트"
                className="h-24 w-full resize-none bg-transparent outline-none
                           placeholder:text-zinc-500 text-zinc-100"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="rounded-full border border-white/15 px-3 py-1.5 text-sm
                                      text-zinc-200 hover:bg-white/10">
                    생각하기 (R1)
                  </button>
                  <button className="rounded-full border border-white/15 px-3 py-1.5 text-sm
                                      text-zinc-200 hover:bg-white/10">
                    검색
                  </button>
                </div>
                <button
                  className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full
                             bg-white text-zinc-900 hover:opacity-90"
                  aria-label="send"
                  type="submit"
                  onClick={(e)=>{
                    e.preventDefault();
                    handleSubmit(prompt, "https://chatgpt.com/?model=gpt-5")
                }}>

                  {loading ? "..." : ">"}

                </button>
              </div>
            </div>

            {/* banner */}
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-indigo-500/30
                            bg-indigo-600/25 px-3 py-2 text-sm text-indigo-200">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full
                               bg-indigo-500 text-white text-[11px] font-bold">29</span>
              <span>업그레이드 35% 할인 ✈️</span>
            </div>
          </div>
        </div>
      </PortalBottom>
    </div>
  );
}



export default SidePanel