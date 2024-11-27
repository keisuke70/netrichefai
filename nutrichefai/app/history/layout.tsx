import { SessionProvider } from "next-auth/react";

export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-[100dvh]">
      <div className="flex-grow p-3 md:p-10 overflow-y-auto h-full">
        <SessionProvider>{children}</SessionProvider>
      </div>
    </div>
  );
}
