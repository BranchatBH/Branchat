const NewChatButton = () => {
  const handleClick = () => {
    chrome.runtime.sendMessage({type:"OPEN_SIDEPANEL"},console.log);
    console.log("message sent");
  }

  return(
    <button className="min-w-0 max-w-full px-[0.75rem] flex items-center justify-between text-sm rounded-[10px] bg-white hover:cursor-pointer mx-[0.375rem] text-black" onClick={handleClick}>
      Start Branch
    </button>
  )
}

export default NewChatButton;