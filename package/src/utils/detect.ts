export function detectProviderFromLocation(loc: Location = window.location): "chatgpt" | "gemini" | "claude" | null {
  const host = loc.hostname;
  if (host.includes("chatgpt.com") || host.includes("openai.com")) return "chatgpt";
  if (host.includes("gemini.google.com")) return "gemini";
  if (host.includes("claude.ai")) return "claude";
  return null;
}

export function detectInChat(url : string){
    return (!url.includes("model"));
}

export function detectProviderFromURL(url: string): "chatgpt" | "gemini" | "claude" | null {
  const host = url;
  if (host.includes("chatgpt.com") || host.includes("openai.com")) return "chatgpt";
  if (host.includes("gemini.google.com")) return "gemini";
  if (host.includes("claude.ai")) return "claude";
  return null;
}