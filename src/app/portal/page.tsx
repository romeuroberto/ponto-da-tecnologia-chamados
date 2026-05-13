import type { Route } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import { PortalLoginForm } from "@/components/portal/portal-login-form";

export default async function PortalPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackParam = params.callbackUrl;
  const callbackUrl = typeof callbackParam === "string" && callbackParam.startsWith("/") ? callbackParam : "/portal/dashboard";

  if (session?.user?.role === "CLIENT") {
    redirect(callbackUrl as Route);
  }

  return (
    <div className="grid min-h-[70vh] gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="space-y-6">
        <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
          Relacionamento, financeiro e suporte no mesmo painel
        </div>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">
            Um portal pensado para o cliente acompanhar tudo sem atrito.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            Consulte o andamento dos chamados, veja pendências financeiras, acesse dados para pagamento e baixe suas
            notas quando estiverem disponíveis.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Chamados</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Abertura rápida, histórico e status em tempo real.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Financeiro</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Pendências, pagamentos confirmados e dados de cobrança.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Documentos</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Notas fiscais e comprovantes disponíveis sem bloquear o uso.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/portal?callbackUrl=/portal-app&portal_view=app"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            Entrar no modo app
          </Link>
          <Link
            href="/portal?callbackUrl=/portal/dashboard&portal_view=full"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 px-5 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-700"
          >
            Portal completo após login
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 text-center">
          <h2 className="text-2xl font-semibold text-slate-950">Acessar portal</h2>
          <p className="mt-1 text-sm text-slate-500">Entre com as credenciais enviadas pela nossa equipe.</p>
        </div>
        <PortalLoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
