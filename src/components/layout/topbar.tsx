import { auth } from "@/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { SignOutButton } from "@/components/layout/sign-out-button";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  ATTENDANT: "Atendente",
  TECHNICIAN: "Técnico",
  CLIENT: "Cliente"
};

export async function Topbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b-2 border-slate-100 bg-white px-4 shadow-md lg:px-8">
      {/* Mobile: mostra a marca; Desktop: mostra contexto */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden rounded-xl px-3 py-1.5" style={{ backgroundColor: "#1B2D5E" }}>
          <BrandMark />
        </div>
        <div className="hidden lg:flex lg:flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Operação</p>
          <p className="text-sm font-medium text-slate-600">Central de atendimento e acompanhamento</p>
        </div>
      </div>

      {/* Usuário + sair */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{user?.name ?? "Sem sessão"}</p>
          <p className="text-xs text-slate-400">
            {user ? roleLabels[user.role] : "Não autenticado"}
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#1B2D5E" }}>
          {user?.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
