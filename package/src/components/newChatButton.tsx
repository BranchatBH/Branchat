import { GitBranchPlus } from "lucide-react";

const NewChatButton = ({id}:{id:number}) => {

  const handleClick = async () => {
    await chrome.runtime.sendMessage({type:"ADD_BRANCH"}, console.log);
    console.log("message sent");
  }

  return(
    <button id={`${id}`} className="text-[#f3f3f3] bg-red-500 hover:bg-[#303030] rounded-lg z-24" onClick={handleClick}>
      <span className="touch:w-10 flex w-8 h-8 items-center justify-center">
        <GitBranchPlus/>
      </span>
    </button>
  )
}

export default NewChatButton;