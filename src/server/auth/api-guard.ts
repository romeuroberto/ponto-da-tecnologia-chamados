import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/server/db-support";
import { userRepository } from "@/server/repositories/user-repository";
import { hasRole } from "@/server/auth/session";
import type { UserRole } from "@/types";

export async function requireApiUser(roles?: UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Não autenticado."
        },
        { status: 401 }
      )
    };
  }

  if (isDatabaseConfigured()) {
    const currentUser = await userRepository.findById(session.user.id);

    if (!currentUser?.active) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Sua sessão não corresponde mais a um usuário ativo. Entre novamente."
          },
          { status: 401 }
        )
      };
    }
  }

  if (roles && !hasRole(session.user.role, roles)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Acesso negado."
        },
        { status: 403 }
      )
    };
  }

  return {
    user: session.user
  };
}
