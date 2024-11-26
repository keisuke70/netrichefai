import { SignIn } from "../component/SignIn";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <div className="w-full max-w-md p-8">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Welcome Back
        </h1>
        <SignIn />
      </div>
    </main>
  );
}
