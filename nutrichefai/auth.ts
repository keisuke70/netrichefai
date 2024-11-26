import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";
import { signInSchema } from "@/lib/zod";

// Fetch the user from the database
async function getUser(email: string) {
  try {
    const user = await sql<{ id: string; email: string; password: string }>`
      SELECT id, email, password FROM users WHERE email = ${email};
    `;
    return user.rows[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate the provided credentials against the schema
          const { email, password } = signInSchema.parse(credentials);

          // Fetch the user from the database
          const user = await getUser(email);

          if (!user) {
            console.error("User not found.");
            return null;
          }

          // Compare the provided password with the stored hash
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            console.error("Invalid password.");
            return null;
          }

          // Return the user object if successful
          return { id: user.id, email: user.email };
        } catch (error) {
          if (error instanceof Error) {
            console.error("Authorization error:", error.message);
          } else {
            console.error("Unexpected error:", error);
          }
          return null;
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    // Include user ID in the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // Add user ID to the token
      }
      return token;
    },
    // Expose user ID in the session object
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string; // Include user ID in the session
      }
      return session;
    },
  },
});
