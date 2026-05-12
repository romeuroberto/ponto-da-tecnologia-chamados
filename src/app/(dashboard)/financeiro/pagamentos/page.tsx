import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { FormMessage } from "@/components/forms/form-message";
import { PageHeader } from "@/components/layout/page-header";
import { QrCodeUploader } from "@/components/payment/qr-code-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { paymentInstructionSchema } from "@/lib/validations/portal-admin";
import { requireRole } from "@/server/auth/session";
import { clientService } from "@/server/services/client-service";
import { paymentInstructionService } from "@/server/services/payment-instruction-service";

function getMessage(status?: string, message?: string) {
  if (!status || !message) return null;
  return <FormMessage type={status === "success" ? "success" : "error"} message={message} />;
}

export default async function PaymentInstructionsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "ATTENDANT"]);
  const [instructions, clients] = await Promise.all([
    paymentInstructionService.listAll(),
    clientService.listClients()
  ]);
  const clientMap = new Map(clients.map((client) => [client.id, client.name]));
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const message = typeof params.message === "string" ? params.message : undefined;

  async function createInstruction(formData: FormData) {
    "use server";
    await requireRole(["ADMIN", "ATTENDANT"]);

    const parsed = paymentInstructionSchema.safeParse({
      clientId: formData.get("clientId")?.toString() ?? "",
      title: formData.get("title")?.toString() ?? "",
      paymentChannel: formData.get("paymentChannel")?.toString() ?? "",
      pixKey: formData.get("pixKey")?.toString() ?? "",
      pixCopyPaste: formData.get("pixCopyPaste")?.toString() ?? "",
      qrCodeImagePath: formData.get("qrCodeImagePath")?.toString() ?? "",
      bankName: formData.get("bankName")?.toString() ?? "",
      bankAgency: formData.get("bankAgency")?.toString() ?? "",
      bankAccount: formData.get("bankAccount")?.toString() ?? "",
      accountHolder: formData.get("accountHolder")?.toString() ?? "",
      accountDocument: formData.get("accountDocument")?.toString() ?? "",
      notes: formData.get("notes")?.toString() ?? "",
      active: formData.get("active") === "on",
      sortOrder: Number(formData.get("sortOrder")?.toString() ?? "0")
    });

    if (!parsed.success) {
      redirect("/financeiro/pagamentos?status=error&message=Confira%20os%20dados%20da%20nova%20instru%C3%A7%C3%A3o%20de%20pagamento.");
    }

    await paymentInstructionService.create(parsed.data);
    revalidatePath("/financeiro/pagamentos");
    revalidatePath("/portal/financeiro");
    revalidatePath("/portal/dashboard");
    redirect("/financeiro/pagamentos?status=success&message=Instru%C3%A7%C3%A3o%20de%20pagamento%20criada%20com%20sucesso.");
  }

  async function updateInstruction(formData: FormData) {
    "use server";
    await requireRole(["ADMIN", "ATTENDANT"]);

    const id = formData.get("id")?.toString() ?? "";
    const parsed = paymentInstructionSchema.safeParse({
      clientId: formData.get("clientId")?.toString() ?? "",
      title: formData.get("title")?.toString() ?? "",
      paymentChannel: formData.get("paymentChannel")?.toString() ?? "",
      pixKey: formData.get("pixKey")?.toString() ?? "",
      pixCopyPaste: formData.get("pixCopyPaste")?.toString() ?? "",
      qrCodeImagePath: formData.get("qrCodeImagePath")?.toString() ?? "",
      bankName: formData.get("bankName")?.toString() ?? "",
      bankAgency: formData.get("bankAgency")?.toString() ?? "",
      bankAccount: formData.get("bankAccount")?.toString() ?? "",
      accountHolder: formData.get("accountHolder")?.toString() ?? "",
      accountDocument: formData.get("accountDocument")?.toString() ?? "",
      notes: formData.get("notes")?.toString() ?? "",
      active: formData.get("active") === "on",
      sortOrder: Number(formData.get("sortOrder")?.toString() ?? "0")
    });

    if (!id || !parsed.success) {
      redirect("/financeiro/pagamentos?status=error&message=Confira%20os%20dados%20da%20instru%C3%A7%C3%A3o%20de%20pagamento.");
    }

    await paymentInstructionService.update(id, parsed.data);
    revalidatePath("/financeiro/pagamentos");
    revalidatePath("/portal/financeiro");
    revalidatePath("/portal/dashboard");
    redirect("/financeiro/pagamentos?status=success&message=Instru%C3%A7%C3%A3o%20de%20pagamento%20atualizada.");
  }

  async function deleteInstruction(formData: FormData) {
    "use server";
    await requireRole(["ADMIN", "ATTENDANT"]);

    const id = formData.get("id")?.toString() ?? "";
    if (!id) {
      redirect("/financeiro/pagamentos?status=error&message=Instru%C3%A7%C3%A3o%20de%20pagamento%20n%C3%A3o%20encontrada.");
    }

    await paymentInstructionService.delete(id);
    revalidatePath("/financeiro/pagamentos");
    revalidatePath("/portal/financeiro");
    revalidatePath("/portal/dashboard");
    redirect("/financeiro/pagamentos?status=success&message=Instru%C3%A7%C3%A3o%20de%20pagamento%20removida.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos"
        description="Cadastre os dados bancários, Pix e QR codes que serão exibidos no portal do cliente."
      />

      {getMessage(status, message)}

      <Card>
        <CardHeader>
          <CardTitle>Nova instrução de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInstruction} className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium text-slate-700">Título</label>
                <Input id="title" name="title" placeholder="Ex.: Pix principal" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="paymentChannel" className="text-sm font-medium text-slate-700">Canal</label>
                <Input id="paymentChannel" name="paymentChannel" placeholder="Pix, Transferência..." required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="clientId" className="text-sm font-medium text-slate-700">Escopo</label>
                <Select id="clientId" name="clientId" defaultValue="">
                  <option value="">Geral para todos os clientes</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-2">
                <label htmlFor="pixKey" className="text-sm font-medium text-slate-700">Chave Pix</label>
                <Input id="pixKey" name="pixKey" />
              </div>
              <div className="grid gap-2 lg:col-span-2">
                <label htmlFor="pixCopyPaste" className="text-sm font-medium text-slate-700">Pix copia e cola</label>
                <Input id="pixCopyPaste" name="pixCopyPaste" />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">QR code (após criar)</label>
                <p className="text-xs text-slate-400">Salve a instrução primeiro, depois faça o upload do QR code.</p>
                <input type="hidden" name="qrCodeImagePath" value="" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="bankName" className="text-sm font-medium text-slate-700">Banco</label>
                <Input id="bankName" name="bankName" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="bankAgency" className="text-sm font-medium text-slate-700">Agência</label>
                <Input id="bankAgency" name="bankAgency" />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div className="grid gap-2">
                <label htmlFor="bankAccount" className="text-sm font-medium text-slate-700">Conta</label>
                <Input id="bankAccount" name="bankAccount" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="accountHolder" className="text-sm font-medium text-slate-700">Favorecido</label>
                <Input id="accountHolder" name="accountHolder" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="accountDocument" className="text-sm font-medium text-slate-700">Documento</label>
                <Input id="accountDocument" name="accountDocument" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="sortOrder" className="text-sm font-medium text-slate-700">Ordem</label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} min={0} />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="notes" className="text-sm font-medium text-slate-700">Observações</label>
              <Textarea id="notes" name="notes" />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="active" defaultChecked />
              Ativa no portal do cliente
            </label>

            <div className="flex justify-end">
              <Button type="submit">Criar instrução</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {instructions.map((instruction) => (
          <Card key={instruction.id}>
            <CardHeader>
              <CardTitle>{instruction.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateInstruction} className="grid gap-4">
                <input type="hidden" name="id" value={instruction.id} />
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Título</label>
                    <Input name="title" defaultValue={instruction.title} required />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Canal</label>
                    <Input name="paymentChannel" defaultValue={instruction.paymentChannel} required />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Escopo</label>
                    <Select name="clientId" defaultValue={instruction.clientId ?? ""}>
                      <option value="">Geral para todos os clientes</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Escopo atual: <span className="font-semibold text-slate-900">{instruction.clientId ? clientMap.get(instruction.clientId) ?? "Cliente específico" : "Todos os clientes"}</span>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Input name="pixKey" defaultValue={instruction.pixKey ?? ""} placeholder="Chave Pix" />
                  <Input name="pixCopyPaste" defaultValue={instruction.pixCopyPaste ?? ""} placeholder="Pix copia e cola" className="lg:col-span-2" />
                </div>

                <input type="hidden" name="qrCodeImagePath" value={instruction.qrCodeImagePath ?? ""} />
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">QR code</label>
                    <QrCodeUploader instructionId={instruction.id} currentPath={instruction.qrCodeImagePath} />
                  </div>
                  <Input name="bankName" defaultValue={instruction.bankName ?? ""} placeholder="Banco" />
                  <Input name="bankAgency" defaultValue={instruction.bankAgency ?? ""} placeholder="Agência" />
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                  <Input name="bankAccount" defaultValue={instruction.bankAccount ?? ""} placeholder="Conta" />
                  <Input name="accountHolder" defaultValue={instruction.accountHolder ?? ""} placeholder="Favorecido" />
                  <Input name="accountDocument" defaultValue={instruction.accountDocument ?? ""} placeholder="Documento" />
                  <Input name="sortOrder" type="number" defaultValue={instruction.sortOrder} min={0} />
                </div>

                <Textarea name="notes" defaultValue={instruction.notes ?? ""} placeholder="Observações" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name="active" defaultChecked={instruction.active} />
                    Ativa no portal
                  </label>

                  <div className="flex gap-2">
                    <Button type="submit" variant="secondary">Salvar alterações</Button>
                    <Button type="submit" formAction={deleteInstruction} variant="outline">Remover</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
