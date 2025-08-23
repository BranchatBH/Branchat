import { AuthUser } from "@/context/AuthContext";
import { useLogin } from "@/hooks/useLogin";

const LoginButton = () => {
  const { login, inProgress: loading, error } = useLogin();

  if (error) {
    return <div className="z-10 bg-white text-red-500 font-bold">{"Something went wrong"}</div>;
  }

  const handleClick = async () => {
    login().then((user:AuthUser) => console.log("user:", user)).catch((e)=>console.log("login error:", e));

  }

  return (
    <button
      className="p-2 text-md font-bold hover:cursor-pointer"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "Loading..." : "Login"}
    </button>
  );
};

export default LoginButton;
