chrome.runtime.onInstalled.addListener(()=>{
    chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1],  // Remove any existing rules with ID 1
            addRules: [{
                id: 1,
                priority: 1,
                action: {
                    type: "modifyHeaders",
                    responseHeaders: [
                        {
                            header: "Content-Security-Policy",
                            operation: "remove"
                        },
                        {
                            header: "X-Frame-Options",
                            operation: "remove"
                        },
                        {
                            header: "Frame-Options",
                            operation: "remove"
                        },
                        {
                            header: "Frame-Ancestors",
                            operation: "remove"
                        },
                        {
                            header: "X-Content-Type-Options",
                            operation: "remove"
                        },
                        {
                            header: "Access-Control-Allow-Origin",
                            operation: "set", value: "*"
                        },
                    ]
                },
                condition: {
                    resourceTypes: ["main_frame", "sub_frame"],
                }
            }]
        }).catch((error) => console.error('Rule Update Error:', error));

        chrome.runtime.onMessage.addListener((message, sender) => {
        if (message.type === "OPEN_SIDEPANEL"){
            console.log("received"); 
            (async () => {
            try{
                await chrome.sidePanel.open({tabId : sender.tab?.id || 0})
                const target = encodeURIComponent("https://chatgpt.com/");
                await chrome.sidePanel.setOptions({
                tabId: sender.tab!.id,
                path: `src/sidepanel/main.html?url=${target}`,
                enabled: true
                });
                console.log("created");
            }catch(err){
                console.log(err);
            }
            })();
            chrome.tabs.create({ url: "https://chatgpt.com", active: false }, function() {});
        }
        });
})

