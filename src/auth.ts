import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { users } from "@/lib/mock-data";
import { loginSchema } from "@/lib/validations/auth";
import { isDatabaseConfigured } from "@/server/db-support";
import { userRepository } from "@/server/repositories/user-repository";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        if (!isDatabaseConfigured()) {
          const mockUser = users.find((user) => user.email === parsed.data.email);

          if (!mockUser || !mockUser.active || parsed.data.password !== "123456") {
            return null;
          }

          return {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role
          };
        }

        const user = await userRepository.findAuthByEmail(parsed.data.email);

        if (!user || !user.active) {
          return null;
        }

        const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientId: user.clientId ?? undefined
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientId = user.clientId;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "TECHNICIAN";
        session.user.clientId = token.clientId;
      }

      return session;
    }
  }
});
