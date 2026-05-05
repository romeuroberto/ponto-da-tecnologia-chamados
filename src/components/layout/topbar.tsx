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
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl px-3 py-1.5 lg:hidden" style={{ backgroundColor: "#1B2D5E" }}>
          <BrandMark />
        </div>
        <div className="hidden lg:flex lg:flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Operação</p>
          <p className="text-sm font-medium text-slate-600">Central de atendimento e acompanhamento</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{user?.name ?? "Sem sessão"}</p>
          <p className="text-xs text-slate-400">{user ? roleLabels[user.role] : "Não autenticado"}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: "#1B2D5E" }}>
          {user?.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
