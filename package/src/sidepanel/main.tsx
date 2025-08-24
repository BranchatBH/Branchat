import ReactDOM from "react-dom/client";
import React from 'react';
import SidePanel from "./sidepanel";
import { AuthContextProvider } from "@/context/AuthContext";
import { URLContextProvider } from "@/context/URLContext";


function mount() {
  const el = document.getElementById("root");
  if (!el) return console.error("root not found");
  if ((window as any).__sidePanelRoot__) return;
  (window as any).__sidePanelRoot__ = ReactDOM.createRoot(el);
  (window as any).__sidePanelRoot__.render(
    <React.StrictMode>
      <AuthContextProvider>
        <URLContextProvider>
          <SidePanel /> 
        </URLContextProvider>
      </AuthContextProvider>
    </React.StrictMode>
  );
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}