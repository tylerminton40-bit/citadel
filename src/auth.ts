import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, token }) {
      return session
    },
  },
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)