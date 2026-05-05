import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { requirePortalUser } from "@/server/auth/session";
import { portalService } from "@/server/services/portal-service";

export default async function PortalDocumentsPage() {
  const user = await requirePortalUser();
  const documents = await portalService.listDocuments(user.clientId);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Documentos</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Notas fiscais e anexos financeiros</h1>
        <p className="mt-2 text-sm text-slate-500">Quando houver emissão, os documentos ficam disponíveis aqui sem bloquear o uso do portal.</p>
      </div>

      <PortalDocumentList documents={documents} />
    </div>
  );
}
