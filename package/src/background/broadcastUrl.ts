import type { Provider } from "@/types/types"
import { detectInChat, detectProviderFromURL } from "@/utils/detect";

export interface ChatURL{
    url? : string | null
    provider : Provider | null;
    inChat : boolean
}

export const getTabUrl = async (tabId: number, url?:string) : Promise<ChatURL | null> => {
    const t = await chrome.tabs.get(tabId);
    const newUrl = url ?? t?.url; 
    if(!newUrl) return null;

    return {url:newUrl, provider : detectProviderFromURL(newUrl), inChat: detectInChat(newUrl)};
}

export async function broadcastUrl(tabId:number, _url?: string){
    const res = await getTabUrl(tabId, _url );
    if(!res){throw new Error("no URL to broadcast");}
    chrome.runtime.sendMessage({type: "SIDEPANEL_URL_CHANGE", data: res, tabId});
}