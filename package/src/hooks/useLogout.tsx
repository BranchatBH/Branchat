import { useAuthContext } from "@/context/AuthContext";
import { serverLogout } from "@/utils/auth";
import { useCallback } from 'react';

const useLogout = () => {
    const { setAuthUser, apiFetch} = useAuthContext();
    const logout = useCallback(async () => {
       try {
             const r = await apiFetch("/auth/logout", { method: "POST" });
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