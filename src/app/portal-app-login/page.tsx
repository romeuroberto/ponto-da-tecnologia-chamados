import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, FileText, LifeBuoy, Smartphone } from "lucide-react";

import { auth } from "@/auth";
import { PortalLoginForm } from "@/components/portal/portal-login-form";

export default async function PortalAppLoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackParam = params.callbackUrl;
  const callbackUrl = typeof callbackParam === "string" && callbackParam.startsWith("/") ? callbackParam : "/portal-app";

  if (session?.user?.role === "CLIENT") {
    redirect(callbackUrl as Route);
  }

  if (session?.user) {
    redirect("/dashboard" as Route);
  }

  const highlights = [
    {
      icon: LifeBuoy,
      title: "Chamados",
      description: "Abra solicitações e acompanhe o histórico em formato mais direto para celular."
    },
    {
      icon: CreditCard,
      title: "Financeiro",
      description: "Consulte cobranças, formas de pagamento e o resumo financeiro dos atendimentos."
    },
    {
      icon: FileText,
      title: "Documentos",
      description: "Acesse notas e comprovantes liberados para o seu cliente sem sair do app."
    }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#dbeafe_100%)] px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center gap-6">
        <div className="rounded-[2rem] bg-slate-950 px-5 py-6 text-white shadow-xl shadow-slate-950/15">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200">Modo app</p>
              <h1 className="mt-1 text-2xl font-semibold">Portal do Cliente</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            Entre para acompanhar chamados, financeiro, vendas e documentos em uma experiência pensada para celular.
          </p>
        </div>

        <div className="grid gap-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-[1.6rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
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
            <h2 className="text-xl font-semibold text-slate-950">Acessar app do cliente</h2>
            <p className="mt-1 text-sm text-slate-500">Use as credenciais enviadas pela equipe da Ponto da Tecnologia.</p>
          </div>
          <PortalLoginForm callbackUrl={callbackUrl} />
        </div>

        <Link
          href="/portal?callbackUrl=/portal/dashboard&portal_view=full"
          className="text-center text-sm font-semibold text-slate-500 transition hover:text-slate-700"
        >
          Abrir versão completa do portal
        </Link>
      </div>
    </div>
  );
}
