import { useAuthContext } from "@/context/AuthContext";
import { ensureAccessToken, serverLogout } from "@/utils/auth";
import { useCallback } from 'react';
import { API_ORIGIN } from "@/utils/auth";

const useLogout = () => {
    const { setAuthUser, apiFetch} = useAuthContext();
    const logout = useCallback(async () => {
       try {
             const at = await ensureAccessToken();
             const headers = new Headers({});
             headers.set("Authorization", `Bearer ${at}`);
             headers.set("Authorization", `Bearer ${at}`);
             const r = await fetch(`${API_ORIGIN}/auth/logout`, { method: "POST", headers });
             if (!r.ok) throw new Error(`HTTP ERROR: ${r.status}`);
         } catch (err) {
             console.warn("logout api failed:", err);
         } finally {
             await serverLogout();
             setAuthUser(null);
         }
     }, [apiFetch, setAuthUser])
    return { logout }; 
};

export default useLogout;