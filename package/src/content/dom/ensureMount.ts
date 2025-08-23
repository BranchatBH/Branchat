export function ensureMount() {
  let host = document.getElementById("extension-Branchat") as HTMLElement | null;
  if (!host) {
    host = document.createElement("div");
    host.id = "extension-Branchat";
    host.setAttribute("data-branchat-root", "");
    document.body.appendChild(host);
  }

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });

  let mountEl = shadow.getElementById("extension-Branchat-root") as HTMLElement | null;
  if (!mountEl) {
    mountEl = document.createElement("div");
    mountEl.id = "extension-Branchat-root";
    shadow.appendChild(mountEl);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("tailwind.css");
    shadow.appendChild(link);
  }

  return { host, shadow, mountEl };
}
