import Link from "next/link";
import SignupForm from "../component/SignUp";

export default function LoginPage() {
  return (
    <main
      className="flex items-center justify-center min-h-screen"
      style={{
        background:
          "linear-gradient(150deg, #334491, #344592, #476db8,  #6a9cd7, #c8d2dc,#dac9b9)",
      }}
    >
      <div className="w-full max-w-md p-8">
        <div className="flex flex-col items-center w-full max-w-[400px] p-4 space-y-6">
          <SignupForm />
        </div>
        <p className="text-center mt-4 text-white">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
