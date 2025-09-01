import { ensureAccessToken, clearLocalAuth} from "@/utils/auth";
import { API_ORIGIN } from "@/utils/auth";
export const fetchBackground = async (path: string, init: RequestInit = {})=> {
    const headers = new Headers(init.headers || {});
    try {
      const at = await ensureAccessToken();
      console.log("at", at);
      if (at) headers.set("Authorization", `Bearer ${at}`);
    } catch {
    }

    let res = await fetch(API_ORIGIN + path, { ...init, headers });

    if (res.status === 401) {
      console.log("unauthorized");
      try {
        const at = await ensureAccessToken();
        console.log("at", at);
        headers.set("Authorization", `Bearer ${at}`);
        res = await fetch(API_ORIGIN + path, { ...init, headers });
      } catch {
          await clearLocalAuth();
          throw new Error("unauthorized");
      }
    }
    return res;
  }