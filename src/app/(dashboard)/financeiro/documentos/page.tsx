import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { FormMessage } from "@/components/forms/form-message";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fiscalDocumentTypeLabel, financialStatusLabel, portalTicketStatusLabel } from "@/lib/portal";
import { fiscalDocumentSchema } from "@/lib/validations/portal-admin";
import { formatCurrency, formatDate, parseCurrencyInput } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
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
  const [documents, ticketResult, sales] = await Promise.all([
    fiscalDocumentService.listByClient(selectedClientId || undefined),
    selectedClientId
      ? ticketService.searchTickets({ client: selectedClientId, sort: "updated_desc", pageSize: 100 })
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }),
    selectedClientId ? saleService.listSales({ clientId: selectedClientId }) : Promise.resolve([])
  ]);
  const clientMap = new Map(clients.map((client) => [client.id, client]));

  async function createDocument(formData: FormData) {
    "use server";
    await requireRole(["ADMIN", "ATTENDANT"]);

    const ticketIds = formData.getAll("ticketIds").map(String);
    const saleIds = formData.getAll("saleIds").map(String);
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
      saleIds
    });

    if (!parsed.success || parsed.data.ticketIds.length + parsed.data.saleIds.length === 0) {
      redirect(`/financeiro/documentos?clientId=${encodeURIComponent(formData.get("clientId")?.toString() ?? "")}&status=error&message=Selecione%20o%20cliente%2C%20os%20dados%20do%20documento%20e%20ao%20menos%20um%20chamado%20ou%20venda.`);
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
        description="Lance notas e recibos, vinculando um ou vários chamados e vendas para operacionalizar o portal do cliente."
      />

      {getMessage(status, message)}

      <Card>
        <CardHeader>
          <CardTitle>Selecionar cliente para emissão</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/financeiro/documentos" className="flex flex-wrap items-end gap-3">
            <div className="grid w-full max-w-sm gap-2">
              <label htmlFor="clientIdFilter" className="text-sm font-medium text-slate-700">Cliente</label>
              <Select id="clientIdFilter" name="clientId" defaultValue={selectedClientId}>
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">Carregar vínculos</Button>
          </form>
        </CardContent>
      </Card>

      {selectedClientId ? (
        <Card>
          <CardHeader>
            <CardTitle>Novo documento fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createDocument} className="grid gap-5">
              <input type="hidden" name="clientId" value={selectedClientId} />
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Cliente selecionado: <span className="font-semibold text-slate-900">{clientMap.get(selectedClientId)?.name ?? "Cliente não encontrado"}</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Tipo</label>
                  <Select name="type" defaultValue="NFSE">
                    <option value="NFSE">NFS-e</option>
                    <option value="NFE">NF-e</option>
                    <option value="RECIBO">Recibo</option>
                    <option value="OUTRO">Outro</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Número</label>
                  <Input name="number" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Série</label>
                  <Input name="series" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Data de emissão</label>
                  <Input name="issueDate" type="date" required />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Valor total</label>
                  <Input name="totalAmount" placeholder="0,00" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Nome do arquivo</label>
                  <Input name="fileName" placeholder="nf-0001.pdf" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Caminho do arquivo</label>
                  <Input name="filePath" placeholder="/uploads/fiscal/nf-0001.pdf" required />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Observações</label>
                <Textarea name="notes" />
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-950">Chamados para agrupar</h3>
                  <p className="mt-1 text-sm text-slate-500">Selecione um ou mais chamados para vincular ao documento.</p>
                  <div className="mt-4 max-h-72 space-y-2 overflow-auto pr-2">
                    {ticketResult.items.length > 0 ? (
                      ticketResult.items.map((ticket) => (
                        <label key={ticket.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                          <input type="checkbox" name="ticketIds" value={ticket.id} className="mt-1" />
                          <span>
                            <span className="font-semibold text-slate-950">{ticket.number}</span>
                            <span className="block text-slate-600">{ticket.title}</span>
                            <span className="block text-xs text-slate-400">
                              Status: {portalTicketStatusLabel[ticket.status]} · Atualizado em {formatDate(ticket.updatedAt)}
                            </span>
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Nenhum chamado encontrado para este cliente.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-950">Vendas para agrupar</h3>
                  <p className="mt-1 text-sm text-slate-500">Selecione também vendas quando a nota cobrir peças ou produtos.</p>
                  <div className="mt-4 max-h-72 space-y-2 overflow-auto pr-2">
                    {sales.length > 0 ? (
                      sales.map((sale) => (
                        <label key={sale.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                          <input type="checkbox" name="saleIds" value={sale.id} className="mt-1" />
                          <span>
                            <span className="font-semibold text-slate-950">{sale.number}</span>
                            <span className="block text-slate-600">{sale.items.length} item(s)</span>
                            <span className="block text-xs text-slate-400">
                              Status: {financialStatusLabel[sale.financialStatus]} · {formatCurrency(sale.totalAmount)}
                            </span>
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Nenhuma venda encontrada para este cliente.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">Lançar documento fiscal</Button>
              </div>
            </form>
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
