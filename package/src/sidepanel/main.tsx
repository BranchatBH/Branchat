import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

const NewChatWindow = () => {
  return (
    <div className="h-full w-full flex flex-col">
      <iframe
        id="iframe"
        src="https://chatgpt.com/"
        title="Side Panel"
        width="100%"
        height="700"
        className="flex-1 w-full h-[100vh]"
      ></iframe>
    </div>
  );
};

const rootElement = document.getElementById("root");
console.log("Trying to mount root");

if (rootElement) {
  if (!(window as any).__sidePanelRoot__) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<NewChatWindow />);
    (window as any).__sidePanelRoot__ = root;
  } else {
    console.warn("React root already exists on side panel");
  }
} else {
  console.error("Side panel root element not found");
}

export default NewChatWindow;
