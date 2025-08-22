import useLogout from "@/hooks/useLogout";

const LogoutButton = () => {
    const { logout } = useLogout();
    return (
        <button className="p-2 text-md font-bold" onClick={logout}>Logout</button>
    )
};

export default LogoutButton;

