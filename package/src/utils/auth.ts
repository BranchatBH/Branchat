export const API_ORIGIN = "https://api.branchat.p-e.kr/api/v1"; 
const RT_KEY = "refreshToken";
const SKEW_SEC = 60;

export type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  accessExp?: number;
};

async function getRefresh(): Promise<string | null> {
  const v = await chrome.storage.session.get(RT_KEY);
  return (v?.[RT_KEY] as string) ?? null;
}
async function setRefresh(rt: string | null): Promise<void> {
  return rt
    ? chrome.storage.session.set({ [RT_KEY]: rt })
    : chrome.storage.session.remove(RT_KEY);
}

let accessToken: string | null = null;
let accessExpSec = 0;
let refreshing: Promise<string> | null = null;

const nowSec = () => Math.floor(Date.now() / 1000);

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}
function setAccess(at: string, exp?: number) {
  accessToken = at;
  accessExpSec = exp ?? parseJwtExp(at) ?? nowSec() + 300; // fallback 5m
}
function clearAccess() {
  accessToken = null;
  accessExpSec = 0;
}
function needsRefresh() {
  return !accessToken || accessExpSec - SKEW_SEC <= nowSec();
}

async function callRefreshEndpoint(rt: string): Promise<TokenBundle> {
  const r = await fetch(`${API_ORIGIN}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({ refreshToken: rt }),
  });
  if (!r.ok) throw new Error(`Refresh failed: ${r.status}`);
  return (await r.json()) as TokenBundle;
}

export async function ensureAccessToken(): Promise<string> {
  if (!needsRefresh()) return accessToken as string;
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const rt = await getRefresh();
    if (!rt) throw new Error("Not authenticated");
    const { accessToken: at, refreshToken: newRt, accessExp } =
      await callRefreshEndpoint(rt);
    if (newRt && newRt !== rt) await setRefresh(newRt);
    setAccess(at, accessExp);
    return at;
  })();

  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

export async function acceptLoginTokens(bundle: TokenBundle): Promise<void> {
  await setRefresh(bundle.refreshToken);
  setAccess(bundle.accessToken, bundle.accessExp);
}

export async function clearLocalAuth(): Promise<void> {
  await setRefresh(null);
  clearAccess();
}

export async function serverLogout(): Promise<void> {
  try {
    await fetch(`${API_ORIGIN}/auth/logout`, { method: "POST" });
  } catch {
  }
  await clearLocalAuth();
}
