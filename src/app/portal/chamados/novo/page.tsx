import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePortalUser } from "@/server/auth/session";
import { clientService } from "@/server/services/client-service";
import { ticketService } from "@/server/services/ticket-service";

async function createPortalTicket(formData: FormData) {
  "use server";
  const user = await requirePortalUser();

  const title = formData.get("title")?.toString() ?? "";
  const description = formData.get("description")?.toString() ?? "";
  const requesterName = formData.get("requesterName")?.toString() ?? "";
  const requesterEmail = formData.get("requesterEmail")?.toString() ?? "";

  if (!title || !description || !requesterName) return;

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

  redirect(`/portal/chamados/${ticket.id}` as Route);
}

export default async function PortalNovoTicketPage() {
  const user = await requirePortalUser();
  const client = await clientService.getClient(user.clientId);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <Link href="/portal/chamados" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
          ← Meus chamados
        </Link>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold text-slate-950">Abrir novo chamado</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Descreva o problema ou solicitação com o máximo de contexto possível para acelerar a triagem do nosso time.
          </p>
        </div>

        <form action={createPortalTicket} className="mt-8 grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="title" className="text-sm font-semibold text-slate-700">
              Assunto <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Ex: Computador não liga"
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
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
              rows={6}
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              className="min-h-32 resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                className="h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
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
                className="h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800">
              Abrir chamado
            </button>
            <Link
              href="/portal/chamados"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
