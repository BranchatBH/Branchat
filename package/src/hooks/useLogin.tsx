import { useCallback, useRef, useState, useEffect } from "react";
import { useAuthContext, type AuthUser } from "../context/AuthContext";
import { API_ORIGIN, acceptLoginTokens } from "../utils/auth";

// ======= CONFIG: fill these in =======
const GOOGLE_CLIENT_ID = "139435746696-ipu6o7pouh8238htm0ug9luh7h1gisjv.apps.googleusercontent.com";
const GOOGLE_CLIENT_PASSWORD = "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"
const REDIRECT_URI = "https://branchat.netlify.app/auth/callback"; // your bridge/callback page
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

function waitForCode(expectedOrigin: string): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Auth timed out"));
    }, 120000);

    function onMessage(ev: MessageEvent) {
      console.log("got message");
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
  const [error, setError] = useState(false);
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
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent"); // ensure refresh token on re-consent

      popupRef.current = openPopup(authUrl.toString());
      if (!popupRef.current) throw new Error("Popup blocked");

      const redirectOrigin = new URL(REDIRECT_URI).origin;
      const { code, state: returnedState } = await waitForCode(redirectOrigin);
      console.log(code, state);

      if (returnedState !== state) {
        throw new Error("State mismatch");
      }

      const cbUrl = new URL(`${API_ORIGIN}/auth/login/google`);
      cbUrl.searchParams.set("code", code);
      cbUrl.searchParams.set("state", state);
      cbUrl.searchParams.set("code_verifier", codeVerifier); 

      const cbRes = await fetch(cbUrl.toString(), { method: "GET", credentials: "omit" });
      if (!cbRes.ok) {
        const t = await cbRes.text().catch(() => "");
        throw new Error(`Callback failed: ${cbRes.status} ${t}`);
      }

      const tokens = await cbRes.json();

      await acceptLoginTokens(tokens);

      const me = await getMe();
      setAuthUser(me);

      return me;
    } catch(error){
      setError(true);
      console.log("error:", error);
      return null;
    }finally {
      setInProgress(false);
      try { popupRef.current?.close(); } catch {}
    }
  }, [inProgress, setAuthUser, apiFetch, getMe]);

  return { login, inProgress, error };
}
