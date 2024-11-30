import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isSignupPage = nextUrl.pathname === "/signup";
      const isLoginPage = nextUrl.pathname === "/login";
      const isMainPage = nextUrl.pathname === "/";

      if (isSignupPage || isLoginPage) {
        return true;
      }

      // Require authentication for main pages
      if (isMainPage) {
        if (isLoggedIn) return true;
        return NextResponse.redirect(new URL("/login", nextUrl));
      }

      // Redirect logged-in users away from /login or /signup to /
      if (isLoggedIn && (isLoginPage || isSignupPage)) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
