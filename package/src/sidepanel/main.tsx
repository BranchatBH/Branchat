import ReactDOM from "react-dom/client";
import SidePanel from "./sidepanel";

function mount() {
  const el = document.getElementById("root");
  if (!el) return console.error("root not found");
  if ((window as any).__sidePanelRoot__) return;
  (window as any).__sidePanelRoot__ = ReactDOM.createRoot(el);
  (window as any).__sidePanelRoot__.render(<SidePanel />);
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}