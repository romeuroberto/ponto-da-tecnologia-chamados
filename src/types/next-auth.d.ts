import "next-auth";
import "next-auth/jwt";

import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      clientId?: string;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    clientId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    clientId?: string;
  }
}
