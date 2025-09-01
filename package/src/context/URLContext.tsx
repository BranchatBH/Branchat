import { Provider } from "@/types/types";
import { detectInChat, detectProviderFromURL } from "@/utils/detect";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useAuthContext } from "./AuthContext";

type URLContextValue = {
    url: string | null,
    provider : Provider | null,
    isChat : boolean,
    chatId: string | null,
}

const URLContext = createContext<URLContextValue | undefined>(undefined);

export const useURLContext = ():URLContextValue => {
    const ctx = useContext(URLContext);
    if(!ctx) throw new Error("useURLContext must be used within a URLContextProvider");
    return ctx;
}

type Props = {children : ReactNode};

export const URLContextProvider : React.FC<Props> = ({children}:Props) => {
    const [tabId, setTabId] = useState<number|null>(null)
    const [url, setUrl] = useState<string|null>(null);
    const [isChat, setIsChat] = useState<boolean>(false);
    const [provider, setProvider] = useState<Provider|null>(null);
    const [chatId, setChatId] = useState<string|null>(null);
    const {apiFetch} = useAuthContext();
    useEffect(() => {
        const getMyTabId = async () : Promise<number> => {
            const [tab] = await chrome.tabs.query({ active : true, currentWindow : true});
            if(!tab?.id) throw new Error("No active tab");
            return tab.id;
        };
        
        getMyTabId().then(setTabId).catch(console.error);
    },[]);

    useEffect(() => {
        if(!tabId) return;
        chrome.tabs.get(tabId).then((t) => {
            if (t.url){
                setProvider(detectProviderFromURL(t.url));
                setUrl(t.url);
                setIsChat(detectInChat(t.url));
                //get the tree it belongs 
            }
        }).catch(console.error);
    },[tabId]);

    useEffect(() => {
        if(!tabId) return;
        chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
            if(msg?.type === "SIDEPANEL_URL_CHANGE" && msg.tabId === tabId){
                setProvider(msg.data.provider);
                setUrl(msg.data.url);
                setIsChat(msg.data.inChat);
                //get the tree it belongs 
                sendResponse({ok:true});
                return true;
            }
        })
        return () => {}; // needs a cleanup logic 
    },[tabId]);

    useEffect(() => {
        if(!url) return;
        const getChatId = async () => {
            const res = await apiFetch(`/nodes/${url}`);
            return res.ok ? ((await res.json()).data as string) : null;
        };
        getChatId().then((r)=>setChatId(r)).catch(console.log);
    },[url])

    const value = useMemo(() => ({url, isChat, provider, chatId}), [tabId, url]);



    
    return (
        <URLContext.Provider value={value}>{children}</URLContext.Provider>
    );
}