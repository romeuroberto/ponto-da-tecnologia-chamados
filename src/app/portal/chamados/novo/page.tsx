import type { Route } from "next";
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
    <div className="space-y-8">
      <div>
        <a href="/portal/chamados" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
          ← Meus chamados
        </a>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Abrir novo chamado</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Descreva o problema ou solicitação com o máximo de contexto possível para acelerar a triagem do nosso time.
        </p>

        <form action={createPortalTicket} className="mt-8 space-y-5">
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
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
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
              rows={5}
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              className="resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

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
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
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
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Abrir chamado
            </button>
            <a
              href="/portal/chamados"
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
