import { useCallback, useRef, useState, useEffect } from "react";
import { useAuthContext, type AuthUser } from "../context/AuthContext";
import { API_ORIGIN, acceptLoginTokens } from "../utils/auth";

// ======= CONFIG: fill these in =======
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";
const REDIRECT_URI = "https://myapp.com/auth/callback"; // your bridge/callback page
const SCOPES = ["openid", "email", "profile"];          // adjust if needed
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
// =====================================

/** RFC7636: generate a code_verifier (43-128 chars) from unreserved chars */
function randomVerifier(length = 64): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let out = "";
  for (let i = 0; i < array.length; i++) {
    out += charset[array[i] % charset.length];
  }
  return out;
}

/** Random state string (not as strict as verifier, just needs to be unpredictable) */
function randomState(length = 32): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let out = "";
  for (let i = 0; i < array.length; i++) {
    out += charset[array[i] % charset.length];
  }
  return out;
}

/** SHA-256 → base64url(code_verifier) to get code_challenge */
async function codeChallengeS256(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function openPopup(url: string, w = 480, h = 640): Window | null {
  const left = Math.round((window.screen.width - w) / 2);
  const top = Math.round((window.screen.height - h) / 2);
  return window.open(
    url,
    "oauth_google",
    `width=${w},height=${h},left=${left},top=${top},resizable,scrollbars`
  );
}

/**
 * Wait for your redirect/bridge page to postMessage back:
 *   window.opener.postMessage({ type: 'OAUTH_CODE', code, state, error }, '*')
 */
function waitForCode(expectedOrigin: string): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Auth timed out"));
    }, 120000);

    function onMessage(ev: MessageEvent) {
      if (ev.origin !== expectedOrigin) return; // security: only trust your domain
      const { type, code, state, error } = (ev.data || {}) as {
        type?: string;
        code?: string;
        state?: string;
        error?: string;
      };
      if (type !== "OAUTH_CODE") return;
      cleanup();
      if (error) reject(new Error(error));
      else if (code && state) resolve({ code, state });
      else reject(new Error("Invalid auth response"));
    }

    function cleanup() {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    }

    window.addEventListener("message", onMessage);
  });
}

export function useLogin() {
  const { setAuthUser, apiFetch, getMe } = useAuthContext();
  const [inProgress, setInProgress] = useState(false);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    return () => {
      try { popupRef.current?.close(); } catch {}
    };
  }, []);

  const login = useCallback(async (): Promise<AuthUser> => {
    if (inProgress) return null;
    setInProgress(true);

    try {
      const codeVerifier = randomVerifier();
      const codeChallenge = await codeChallengeS256(codeVerifier);
      const state = randomState();

      const authUrl = new URL(AUTH_ENDPOINT);
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", SCOPES.join(" "));
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      authUrl.searchParams.set("state", state);
      // For Google refresh tokens:
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent"); // ensure refresh token on re-consent

      // 3) Open popup, go through Google, land on your redirect URI
      popupRef.current = openPopup(authUrl.toString());
      if (!popupRef.current) throw new Error("Popup blocked");

      // 4) Receive code/state from your bridge page
      const redirectOrigin = new URL(REDIRECT_URI).origin;
      const { code, state: returnedState } = await waitForCode(redirectOrigin);

      // 5) Verify state to prevent CSRF
      if (returnedState !== state) {
        throw new Error("State mismatch");
      }

      // 6) Call backend callback (BEGIN backend work)
      //    You said Step 6 is GET /auth/oauth2/google/callback?code=...&state=...
      //    We must also pass code_verifier so the backend can exchange the code in Step 7.
      //    NOTE: sending code_verifier in query is OK, but POST is cleaner if you can change it.
      const cbUrl = new URL(`${API_ORIGIN}/auth/login/google`);
      cbUrl.searchParams.set("code", code);
      cbUrl.searchParams.set("state", state);
      cbUrl.searchParams.set("code_verifier", codeVerifier); // <- include PKCE verifier

      const cbRes = await fetch(cbUrl.toString(), { method: "GET", credentials: "omit" });
      if (!cbRes.ok) {
        const t = await cbRes.text().catch(() => "");
        throw new Error(`Callback failed: ${cbRes.status} ${t}`);
      }
      // 7→10 happen on your backend; it returns your app tokens:
      //    { accessToken, refreshToken, accessExp? }
      const tokens = await cbRes.json();

      // Save tokens locally (refresh -> session storage, access -> memory)
      await acceptLoginTokens(tokens);

      // 11) Use app token to fetch the logged-in user
      const me = await getMe();
      setAuthUser(me);

      return me;
    } finally {
      setInProgress(false);
      try { popupRef.current?.close(); } catch {}
    }
  }, [inProgress, setAuthUser, apiFetch, getMe]);

  return { login, inProgress };
}
