let currentTabId: number | null = null;

// Track tab activation
chrome.tabs.onActivated.addListener(({ tabId }) => {
  currentTabId = tabId;
});

chrome.windows.onFocusChanged.addListener(async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  currentTabId = tab?.id ?? null;
});

chrome.sidePanel.setPanelBehavior({openPanelOnActionClick : true})
    .catch((error) => console.log(error));

chrome.runtime.onMessage.addListener(async (message,sender,sendResponse) => {
  
    if(message.type === "ADD_BRANCH"){
        console.log("got message");
        chrome.tabs.update(currentTabId ?? 0,{ url: "https://chatgpt.com" });
        return;
    }
    
    else if(message.type === "NAVIGATE"){
        if(!currentTabId){
            sendResponse({success : false});
            return;
        }
        const tabId = currentTabId
        console.log("got navigate message");
        await chrome.tabs.update(tabId, {url : message.url});
        await waitForComplete(tabId);
        await waitForContentReady(tabId);
        console.log(tabId);
        try{
            console.log("message prompt:", message.prompt);
            chrome.tabs.sendMessage(tabId, {
                type: "RUN_FILL_AND_SUBMIT",
                prompt: message.prompt ?? ""
            }, (res:any) => {sendResponse(res ?? { success: false }); return;});
            
            }catch(error){
                console.log(error);
                sendResponse({success : false});
                return;
        }
      }
    }
);

async function waitForComplete(tabId: number) {
  const tab = await chrome.tabs.get(tabId);
  if (tab.status === "complete") return;

  await new Promise<void>((resolve) => {
    const listener = (id: number, info: chrome.tabs.OnUpdatedInfo) => {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}


async function waitForContentReady(tabId: number, timeoutMs = 10000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const res = await new Promise<{ ready?: boolean } | undefined>((resolve) => {
      chrome.tabs.sendMessage(tabId, { type: "PING" }, (reply) => {
        // If content isn't there yet, you'll get lastError: "Receiving end does not exist"
        if (chrome.runtime.lastError) {
            console.log("ping failed");
            return resolve(undefined);
        }
        resolve(reply);
      });
    });

    if (res?.ready) {
        console.log(`connected in ${Date.now()-start} ms`);
        return
    };           // ✅ content script is alive
    await new Promise(r => setTimeout(r, 200)); // retry shortly
  }
  throw new Error("Content script not ready (timeout)");
}
