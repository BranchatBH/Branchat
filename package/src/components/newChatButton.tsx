import { GitBranchPlus } from "lucide-react";

const NewChatButton = ({id, text}:{id:number, text:string}) => {

  const onClick = async () => {
        const res = await chrome.runtime.sendMessage({type:'OPEN_SIDEPANEL'});
        if(res?.success){
            await chrome.runtime.sendMessage({ type: 'SELECTION', text });
            console.log("success");
        }
        else{
            console.log("error");
        }
    }

  return(
    <button id={`${id}`} className="text-[#f3f3f3] bg-red-500 hover:bg-[#303030] rounded-lg z-24" onClick={onClick}>
      <span className="touch:w-10 flex w-8 h-8 items-center justify-center">
        <GitBranchPlus/>
      </span>
    </button>
  )
}

export default NewChatButton;