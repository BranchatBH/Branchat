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

export function detectChatUUID(url:string) : string | null{
  const uuidV1toV5 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  let href: string;
  try {
    href = new URL(url).href; // ensures normalization
  } catch {
    href = url; // fallback if not a full URL
  }

  const match = href.match(/\/c\/([0-9a-fA-F-]{36})(?=\/|$|\?|#)/);
  if (!match) return null;

  const id = match[1];
  return uuidV1toV5.test(id) ? id : null;
}