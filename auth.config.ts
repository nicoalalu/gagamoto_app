import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Config edge-compatible (sin PrismaAdapter, solo para middleware)
export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
