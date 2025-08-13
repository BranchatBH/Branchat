import { createRoot } from "react-dom/client"
import "@/global.css"
import BranchInjector from "@/injectors/chatgpt/branchInjector";
import { fillAndSubmit } from "./fillAndSubmit";
import { DomProvider } from "@/providers/DomProvider";
import { detectProviderFromLocation, detectInChat } from "@/utils/detect";
import type { Provider } from "@/types/types";

// ---------- NEW: utilities ----------
const TURN_WRAPPER = '[data-testid="conversation-turn-wrapper"]';
const ASSISTANT_SELECTOR = '[data-message-author-role="assistant"]';
const CHAT_ROOT = 'main'; // stable root in ChatGPT
const processedTurns = new WeakSet<HTMLElement>();
let lastUrl = location.href;

// Add this next to your other helpers
function watchStreamSettle(turnEl: HTMLElement, onSettle: () => void) {
  let settleTimer: number | null = null;
  let lastLen = -1;

  const assistant = turnEl.querySelector<HTMLElement>('[data-message-author-role="assistant"]');
  if (!assistant) return;

  const schedule = () => {
    if (settleTimer) window.clearTimeout(settleTimer);
    // 1200ms of no changes = "finished"
    settleTimer = window.setTimeout(() => {
      onSettle();
    }, 1200);
  };

  // Kick off an initial timer in case content is already complete
  schedule();

  const mo = new MutationObserver(() => {
    const len = assistant.innerText.length;
    if (len !== lastLen) {
      lastLen = len;
      schedule();
    }
  });

  mo.observe(assistant, { childList: true, subtree: true, characterData: true });

  // Stop observing if the node leaves the DOM (optional clean-up)
  const stopIfDetached = () => {
    if (!document.body.contains(turnEl)) {
      mo.disconnect();
      if (settleTimer) window.clearTimeout(settleTimer);
      window.removeEventListener('visibilitychange', stopIfDetached);
    }
  };
  window.addEventListener('visibilitychange', stopIfDetached);
}

function waitFor<T extends Element>(selector: string, root: ParentNode = document, timeout = 15000): Promise<T> {
  const el = root.querySelector<T>(selector);
  if (el) return Promise.resolve(el);
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => {
      obs.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
    const obs = new MutationObserver(() => {
      const found = root.querySelector<T>(selector);
      if (found) {
        clearTimeout(to);
        obs.disconnect();
        resolve(found);
      }
    });
    obs.observe(root as Node, { childList: true, subtree: true });
  });
}

function extractAssistantText(assistantEl: HTMLElement) {
  return assistantEl.innerText.trim();
}

function injectBranchButton(turnEl: HTMLElement) {
  if (processedTurns.has(turnEl)) return;

  const assistantChunk = turnEl.querySelector<HTMLElement>(ASSISTANT_SELECTOR);
  if (!assistantChunk) return;

  // host we own
  const host = document.createElement("span");
  host.style.display = "inline-block";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      button {
        all: initial;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        font-size: 12px; padding: 6px 10px;
        border-radius: 10px; border: 1px solid rgba(0,0,0,.15);
        box-shadow: 0 1px 2px rgba(0,0,0,.05);
        cursor: pointer;
      }
      button:hover { filter: brightness(0.95); }
    </style>
    <button type="button" title="Start a new chat with this reply as the prompt">New branch</button>
  `;
  const btn = shadow.querySelector("button") as HTMLButtonElement;
  btn.addEventListener("click", () => {
    const text = extractAssistantText(assistantChunk);
    chrome.runtime.sendMessage({ type: "ADD_BRANCH_FROM_RESPONSE", text });
  });

  // Attach near the end of the assistant turn
  (assistantChunk.lastElementChild ?? assistantChunk).appendChild(host);

  processedTurns.add(turnEl);
}

async function startTurnObserver() {
  const root = await waitFor<HTMLElement>(CHAT_ROOT);
  // initial pass for already-rendered turns
  root.querySelectorAll(TURN_WRAPPER).forEach((el) => injectBranchButton(el as HTMLElement));

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(TURN_WRAPPER)) injectBranchButton(node);
        else {
          const wrap = node.querySelector?.(TURN_WRAPPER);
          if (wrap){
            injectBranchButton(wrap as HTMLElement);
            watchStreamSettle(wrap as HTMLElement, () => {

            injectBranchButton(wrap as HTMLElement);
            });
          }
        }
      });
    }
  });
  mo.observe(root, { childList: true, subtree: true });
}

function watchUrlChanges() {
  const rearm = () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Re-run React mount (so your BranchInjector can re-evaluate inChat)
      mount(true);
      // Re-arm turn observer for the new page state
      startTurnObserver().catch(() => {});
    }
  };
  const hook = (type: "pushState" | "replaceState") => {
    const orig = history[type];
    // @ts-ignore
    history[type] = function (...args) {
      const ret = orig.apply(this, args as any);
      queueMicrotask(rearm);
      return ret;
    };
  };
  hook("pushState"); hook("replaceState");
  window.addEventListener("popstate", rearm);
  // Cheap safety net
  setInterval(rearm, 1500);
}

// ---------- your original code, slightly hardened ----------
let reactRoot: ReturnType<typeof createRoot> | null = null;

function mount(forceRemount = false) {
  const url = window.location.href;
  const provider: Provider | null = detectProviderFromLocation(window.location);
  const inChat: boolean = detectInChat(url);

  if (!provider) {
    console.log("no url/provider detected");
    return;
  }

  let mountEl = document.getElementById("extension-Branchat");
  if (!mountEl) {
    mountEl = document.createElement("div");
    mountEl.id = "extension-Branchat";
    document.body.appendChild(mountEl);
  }

  if (!reactRoot || forceRemount) {
    reactRoot = createRoot(mountEl);
  }
  const dom = new DomProvider(document, provider);
  reactRoot.render(inChat ? <BranchInjector dom={dom} /> : <div />);
  console.log("mounted");
}

mount();
startTurnObserver().catch(() => {});
watchUrlChanges();

console.log("add listener");

chrome.runtime.onMessage.addListener(async (msg, _sender, sendResponse) => {
  if (msg?.type === "PING") {
    console.log("ready");
    sendResponse({ ready: true });
  }

  if (msg?.type === "RUN_FILL_AND_SUBMIT") {
    console.log("got message");
    const provider: Provider | null = detectProviderFromLocation(window.location);
    try {
      const ok = await fillAndSubmit(msg.prompt ?? "", provider);
      // IMPORTANT: do not create a second React root; just re-arm observers & rerender
      mount(true);
      startTurnObserver().catch(() => {});
      sendResponse({ success: ok });
      return true;
    } catch (e) {
      sendResponse({ success: false, error: String(e) });
      return false;
    }
  }
});
