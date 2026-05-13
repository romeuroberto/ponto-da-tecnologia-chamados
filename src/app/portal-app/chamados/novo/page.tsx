import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalAppSubmitButton } from "@/components/portal-app/portal-app-submit-button";
import { clientService } from "@/server/services/client-service";
import { requirePortalUser } from "@/server/auth/session";
import { ticketService } from "@/server/services/ticket-service";

async function createPortalAppTicket(formData: FormData) {
  "use server";

  const user = await requirePortalUser();

  const title = formData.get("title")?.toString() ?? "";
  const description = formData.get("description")?.toString() ?? "";
  const requesterName = formData.get("requesterName")?.toString() ?? "";
  const requesterEmail = formData.get("requesterEmail")?.toString() ?? "";

  if (!title || !description || !requesterName) {
    return;
  }

  const ticket = await ticketService.createTicket(
    {
      clientId: user.clientId,
      title,
      description,
      priority: "MEDIUM",
      attendanceType: "REMOTE",
      requesterName,
      requesterEmail: requesterEmail || undefined
    },
    user.id
  );

  redirect(`/portal-app/chamados/${ticket.id}` as Route);
}

export default async function PortalAppNewTicketPage() {
  const user = await requirePortalUser();
  const client = await clientService.getClient(user.clientId);

  return (
    <div className="space-y-5">
      <Link href={"/portal-app/chamados" as Route} className="inline-flex text-sm font-semibold text-sky-700">
        ← Voltar para chamados
      </Link>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Novo chamado</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Abrir uma solicitação</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Descreva o problema com o máximo de contexto possível para agilizar a triagem.
          </p>
        </div>

        <form action={createPortalAppTicket} className="mt-6 grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="title" className="text-sm font-semibold text-slate-700">
              Assunto <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Ex: Internet caiu no escritório"
              className="h-12 rounded-2xl border border-slate-300 px-4 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="description" className="text-sm font-semibold text-slate-700">
              Descrição detalhada <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={7}
              placeholder="Conte o que aconteceu, quando começou e qualquer detalhe que ajude nosso atendimento..."
              className="min-h-36 resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="requesterName" className="text-sm font-semibold text-slate-700">
                Seu nome <span className="text-rose-500">*</span>
              </label>
              <input
                id="requesterName"
                name="requesterName"
                type="text"
                required
                defaultValue={client?.contactName ?? ""}
                className="h-12 rounded-2xl border border-slate-300 px-4 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="requesterEmail" className="text-sm font-semibold text-slate-700">
                E-mail para contato
              </label>
              <input
                id="requesterEmail"
                name="requesterEmail"
                type="email"
                placeholder="Opcional"
                defaultValue={client?.email ?? user.email ?? ""}
                className="h-12 rounded-2xl border border-slate-300 px-4 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="grid gap-3 pt-2">
            <PortalAppSubmitButton idleLabel="Abrir chamado" pendingLabel="Abrindo chamado..." />
            <Link
              href={"/portal-app/chamados" as Route}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
