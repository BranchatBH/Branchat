const NewChatWindow = () => {
    return(
        <div className = "h-full flex justify-center bg-transparent right-0 py-10 px-5 inset-y-0 absolute items-center w-[10%] z-10">
            <div className="border-1 border-white rounded-lg w-full h-full overflow-hidden">
            <iframe src="https://chatgpt.com/?model=auto" width="100%" height="100%"></iframe>
            </div>
        </div>
    )
}

export default NewChatWindow;