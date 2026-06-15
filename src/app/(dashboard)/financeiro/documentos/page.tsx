import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { FormMessage } from "@/components/forms/form-message";
import { FiscalDocumentForm } from "@/components/fiscal/fiscal-document-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSelectFilter } from "@/components/ui/client-select-filter";
import { fiscalDocumentTypeLabel } from "@/lib/portal";
import { fiscalDocumentSchema } from "@/lib/validations/portal-admin";
import { formatCurrency, formatDate, parseCurrencyInput } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { contractMonthlyBillingRepository } from "@/server/repositories/contract-monthly-billing-repository";
import { rentalRepository } from "@/server/repositories/rental-repository";
import { clientService } from "@/server/services/client-service";
import { fiscalDocumentService } from "@/server/services/fiscal-document-service";
import { saleService } from "@/server/services/sale-service";
import { ticketService } from "@/server/services/ticket-service";

function getMessage(status?: string, message?: string) {
  if (!status || !message) return null;
  return <FormMessage type={status === "success" ? "success" : "error"} message={message} />;
}

export default async function FiscalDocumentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const message = typeof params.message === "string" ? params.message : undefined;
  const selectedClientId = typeof params.clientId === "string" ? params.clientId : "";

  const clients = await clientService.listClients();
  const [documents, ticketResult, sales, monthlyBillings, rentalBillings] = await Promise.all([
    fiscalDocumentService.listByClient(selectedClientId || undefined),
    selectedClientId
      ? ticketService.searchTickets({ client: selectedClientId, status: "CLOSED", sort: "updated_desc", pageSize: 100 })
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }),
    selectedClientId ? saleService.listSales({ clientId: selectedClientId, financialStatus: "FATURADO" }) : Promise.resolve([]),
    selectedClientId ? contractMonthlyBillingRepository.listByClient(selectedClientId) : Promise.resolve([]),
    selectedClientId ? rentalRepository.listBillingsByClient(selectedClientId) : Promise.resolve([])
  ]);
  const clientMap = new Map(clients.map((client) => [client.id, client]));

  async function createDocument(formData: FormData) {
    "use server";
    await requireRole(["ADMIN", "ATTENDANT"]);

    const ticketIds = formData.getAll("ticketIds").map(String);
    const saleIds = formData.getAll("saleIds").map(String);
    const monthlyBillingIds = formData.getAll("monthlyBillingIds").map(String);
    const rentalBillingIds = formData.getAll("rentalBillingIds").map(String);
    const totalAmountRaw = formData.get("totalAmount")?.toString() ?? "";

    const parsed = fiscalDocumentSchema.safeParse({
      clientId: formData.get("clientId")?.toString() ?? "",
      type: formData.get("type")?.toString() ?? "OUTRO",
      number: formData.get("number")?.toString() ?? "",
      series: formData.get("series")?.toString() ?? "",
      issueDate: formData.get("issueDate")?.toString() ?? "",
      totalAmount: totalAmountRaw ? parseCurrencyInput(totalAmountRaw) : undefined,
      fileName: formData.get("fileName")?.toString() ?? "",
      filePath: formData.get("filePath")?.toString() ?? "",
      notes: formData.get("notes")?.toString() ?? "",
      ticketIds,
      saleIds,
      monthlyBillingIds,
      rentalBillingIds
    });

    const selectedLinks =
      parsed.success
        ? parsed.data.ticketIds.length + parsed.data.saleIds.length + parsed.data.monthlyBillingIds.length + parsed.data.rentalBillingIds.length
        : 0;

    if (!parsed.success || selectedLinks === 0) {
      redirect(`/financeiro/documentos?clientId=${encodeURIComponent(formData.get("clientId")?.toString() ?? "")}&status=error&message=Selecione%20o%20cliente%2C%20os%20dados%20do%20documento%20e%20ao%20menos%20um%20v%C3%ADnculo%20financeiro.`);
    }

    await fiscalDocumentService.create(parsed.data);
    revalidatePath("/financeiro/documentos");
    revalidatePath("/portal/documentos");
    revalidatePath("/portal/dashboard");
    revalidatePath("/portal/financeiro");
    redirect(`/financeiro/documentos?clientId=${encodeURIComponent(parsed.data.clientId)}&status=success&message=Documento%20fiscal%20lan%C3%A7ado%20com%20sucesso.`);
  }

  async function deleteDocument(formData: FormData) {
    "use server";
    await requireRole(["ADMIN", "ATTENDANT"]);
    const id = formData.get("id")?.toString() ?? "";
    const clientId = formData.get("clientId")?.toString() ?? "";
    if (!id) {
      redirect("/financeiro/documentos?status=error&message=Documento%20fiscal%20n%C3%A3o%20encontrado.");
    }

    await fiscalDocumentService.delete(id);
    revalidatePath("/financeiro/documentos");
    revalidatePath("/portal/documentos");
    revalidatePath("/portal/dashboard");
    revalidatePath("/portal/financeiro");
    redirect(`/financeiro/documentos?clientId=${encodeURIComponent(clientId)}&status=success&message=Documento%20fiscal%20removido.`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos fiscais"
        description="Lance notas e recibos, vinculando chamados, vendas, mensalidades e locações para operacionalizar o portal do cliente."
      />

      {getMessage(status, message)}

      <Card>
        <CardHeader>
          <CardTitle>Selecionar cliente para emissão</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientSelectFilter clients={clients} selectedClientId={selectedClientId} action="/financeiro/documentos" />
        </CardContent>
      </Card>

      {selectedClientId ? (
        <Card>
          <CardHeader>
            <CardTitle>Novo documento fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <FiscalDocumentForm
              clientId={selectedClientId}
              clientName={clientMap.get(selectedClientId)?.name ?? "Cliente não encontrado"}
              tickets={ticketResult.items}
              sales={sales}
              monthlyBillings={monthlyBillings}
              rentalBillings={rentalBillings}
              createDocument={createDocument}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Documentos lançados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length > 0 ? (
            documents.map((document) => (
              <div key={document.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{fiscalDocumentTypeLabel[document.type]}</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {document.number}
                      {document.series ? ` · Série ${document.series}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Cliente: {clientMap.get(document.clientId)?.name ?? document.clientId} · Emitido em {formatDate(document.issueDate)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {document.totalAmount !== undefined ? formatCurrency(document.totalAmount) : "Sem valor informado"} · {document.links.length} vínculo(s)
                    </p>
                    <a href={document.filePath} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-medium text-sky-700 hover:underline">
                      Abrir arquivo
                    </a>
                    {document.notes ? <p className="mt-2 text-sm text-slate-600">{document.notes}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {document.links.map((link) => (
                        <span key={link.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                          {link.label ?? "Vínculo relacionado"}
                        </span>
                      ))}
                    </div>
                  </div>

                  <form action={deleteDocument}>
                    <input type="hidden" name="id" value={document.id} />
                    <input type="hidden" name="clientId" value={selectedClientId} />
                    <Button type="submit" variant="outline">Remover</Button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Nenhum documento fiscal lançado para o filtro atual.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
