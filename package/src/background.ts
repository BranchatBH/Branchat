chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'OPEN_SIDE_BY_SIDE') {
    chrome.windows.getCurrent({}, (currentWindow) => {
      const screenWidth = currentWindow.width || 0;
      const screenHeight = currentWindow.height || 0;
      const screenId = currentWindow.id || 0;

      // Resize current window to left
      chrome.windows.update(screenId ?? 0, {
        left: 0,
        top: 0,
        width: screenWidth * 2 / 3 | 0,
        height: screenHeight | 0
      });

      // Open new window on right
      chrome.windows.create({
        url: 'https://chat.openai.com/?chat=new',
        left: screenWidth * 2 / 3 | 0,
        top: 0,
        width: screenWidth / 3 | 0,
        height: screenHeight | 0,
        type: 'popup',
        focused: true
      });
      console.log("new screen created");
    });
  }
});