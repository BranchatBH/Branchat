chrome.sidePanel.setPanelBehavior({openPanelOnActionClick : true})
    .catch((error) => console.log(error));

chrome.runtime.onMessage.addListener((message,sender,sendResponse) => {
    if(message.type === "ADD_BRANCH"){
        console.log("got message");
        chrome.tabs.update(sender.tab?.id, { url: 'https://gemini.google.com/app' });
        sendResponse({success : true});
    } 
    }
);

