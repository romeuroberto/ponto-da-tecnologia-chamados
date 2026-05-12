import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalAppDocumentsPage() {
  const user = await requirePortalUser();
  const documents = await portalService.listDocuments(user.clientId);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Documentos</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Notas e comprovantes</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Tudo o que foi liberado para o cliente em uma única lista.</p>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <PortalDocumentList documents={documents} />
      </section>
    </div>
  );
}
