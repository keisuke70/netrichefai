import Link from "next/link"; // Import the Link component
import { SignIn } from "../component/SignIn";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <div className="w-full max-w-md p-8">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome Back</h1>
        <SignIn />
        <p className="text-center mt-4">
          Don't you have an account?{" "}
          <Link href="/signup" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
