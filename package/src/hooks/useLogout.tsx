import { useAuthContext } from "@/context/AuthContext";
import { serverLogout } from "@/utils/auth";
import { useCallback } from 'react';

const useLogout = () => {
    const { setAuthUser, apiFetch} = useAuthContext();
    const logout = useCallback(async () => {
        apiFetch("auth/logout")
            .then((r) => {
                if(!r.ok) throw new Error(`HTTP ERROR: ${r.status}`);
                return r.json();
            })
            .then(async (data) => {
                await serverLogout();
                setAuthUser(null);
                console.log(data.message)
            })
            .catch((err) => console.warn("logout failed :", err));
    },[apiFetch])
    return { logout }; 
};

export default useLogout;