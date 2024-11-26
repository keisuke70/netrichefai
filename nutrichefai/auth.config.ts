import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnMain = nextUrl.pathname.startsWith("/x"); //later remove x
      if (isOnMain) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
