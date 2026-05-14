import type { Route } from "next";
import { redirect } from "next/navigation";
import { LifeBuoy, MapPinned, Smartphone, TimerReset } from "lucide-react";

import { auth } from "@/auth";
import { PortalLoginForm } from "@/components/portal/portal-login-form";

export default async function FieldAppLoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackParam = params.callbackUrl;
  const callbackUrl = typeof callbackParam === "string" && callbackParam.startsWith("/") ? callbackParam : "/field-app";

  if (session?.user?.role === "TECHNICIAN") {
    redirect(callbackUrl as Route);
  }

  if (session?.user) {
    redirect("/dashboard" as Route);
  }

  const highlights = [
    {
      icon: LifeBuoy,
      title: "Fila pessoal",
      description: "Veja apenas os chamados atribuídos a você, sem o ruído do painel completo."
    },
    {
      icon: TimerReset,
      title: "Ações rápidas",
      description: "Atualize status, responda no histórico e envie anexos direto do celular."
    },
    {
      icon: MapPinned,
      title: "Visitas em campo",
      description: "Registre check-in e check-out quando o atendimento exigir presença no cliente."
    }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#d1fae5_100%)] px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center gap-6">
        <div className="rounded-[2rem] bg-slate-950 px-5 py-6 text-white shadow-xl shadow-slate-950/15">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Modo app</p>
              <h1 className="mt-1 text-2xl font-semibold">Técnicos em campo</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            Entre para operar seus chamados atribuídos em uma experiência pensada para celular, com foco em atendimento rápido.
          </p>
        </div>

        <div className="grid gap-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-[1.6rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold text-slate-950">Acessar app técnico</h2>
            <p className="mt-1 text-sm text-slate-500">Use o seu login interno para abrir a fila operacional de campo.</p>
          </div>
          <PortalLoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
