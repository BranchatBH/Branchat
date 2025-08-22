import { useLogin } from "@/hooks/useLogin";

const LoginButton = () => {
  const { login, inProgress: loading, error } = useLogin();

  if (error) {
    return <div>{error ?? "Something went wrong"}</div>;
  }

  return (
    <button
      className="p-2 text-md font-bold hover:cursor-pointer"
      onClick={login}
      disabled={loading}
    >
      {loading ? "Loading..." : "Login"}
    </button>
  );
};

export default LoginButton;
