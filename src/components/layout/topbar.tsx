import Image from "next/image";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/layout/sign-out-button";

const roleLabels = {
  ADMIN: "Administrador",
  ATTENDANT: "Atendente",
  TECHNICIAN: "T\u00e9cnico"
};

export async function Topbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <Image
            src="/assets/logo-sistema.png"
            alt="Ponto da Tecnologia"
            width={128}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
        </div>
        <div className="hidden lg:block">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{"Opera\u00e7\u00e3o"}</p>
          <p className="text-sm text-slate-600">Central de atendimento e acompanhamento</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Sem sess\u00e3o"}</p>
          <p className="text-xs text-slate-500">
            {user?.email ?? "N\u00e3o autenticado"}
            {user ? ` - ${roleLabels[user.role]}` : ""}
          </p>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
