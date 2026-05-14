import { ShieldCheck, Smartphone, UserRound } from "lucide-react";

import { auth } from "@/auth";

export default async function FieldAppMorePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Conta</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Mais opções</h1>

        <div className="mt-5 rounded-[1.6rem] bg-slate-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">{user?.name ?? "Técnico"}</p>
              <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-950">Modo app operacional</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Esta área foi pensada para uso rápido em campo, com foco apenas nos chamados atribuídos ao seu perfil técnico.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-950">Acesso protegido</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Somente técnicos autenticados entram neste modo. Chamados não atribuídos ao seu usuário ficam fora desta visão mobile.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
