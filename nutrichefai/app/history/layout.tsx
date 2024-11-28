import { SessionProvider } from "next-auth/react";

export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="flex-grow p-3 md:p-10 h-full min-h-0">
        <SessionProvider>{children}</SessionProvider>
      </div>
    </div>
  );
}
