const NewChatWindow = () => {
    return(
        <div className = "h-full flex justify-center max-w-[50%] min-w-[30%] items-center shrink-1 grow w-[40%] z-10">
            <div className="border-1 border-white rounded-lg w-full h-full overflow-hidden">
            <iframe src="https://chatgpt.com/?model=auto" width="100%" height="100%"></iframe>
            </div>
        </div>
    )
}

export default NewChatWindow;