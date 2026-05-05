import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { FormMessage } from "@/components/forms/form-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { companyProfileSchema } from "@/lib/validations/portal-admin";
import { requireRole } from "@/server/auth/session";
import { companyProfileService } from "@/server/services/company-profile-service";

function getMessage(status?: string, message?: string) {
  if (!status || !message) return null;
  return <FormMessage type={status === "success" ? "success" : "error"} message={message} />;
}

export default async function CompanyPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN"]);
  const profile = await companyProfileService.getProfile();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const message = typeof params.message === "string" ? params.message : undefined;

  async function saveCompanyProfile(formData: FormData) {
    "use server";

    await requireRole(["ADMIN"]);

    const parsed = companyProfileSchema.safeParse({
      legalName: formData.get("legalName")?.toString() ?? "",
      tradeName: formData.get("tradeName")?.toString() ?? "",
      document: formData.get("document")?.toString() ?? "",
      stateRegistration: formData.get("stateRegistration")?.toString() ?? "",
      municipalRegistration: formData.get("municipalRegistration")?.toString() ?? "",
      financialEmail: formData.get("financialEmail")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
      website: formData.get("website")?.toString() ?? "",
      addressLine1: formData.get("addressLine1")?.toString() ?? "",
      addressLine2: formData.get("addressLine2")?.toString() ?? "",
      city: formData.get("city")?.toString() ?? "",
      state: formData.get("state")?.toString() ?? "",
      postalCode: formData.get("postalCode")?.toString() ?? "",
      notes: formData.get("notes")?.toString() ?? ""
    });

    if (!parsed.success) {
      redirect("/empresa?status=error&message=Confira%20os%20dados%20obrigat%C3%B3rios%20da%20empresa.");
    }

    await companyProfileService.saveProfile(parsed.data);
    revalidatePath("/empresa");
    redirect("/empresa?status=success&message=Perfil%20da%20empresa%20salvo%20com%20sucesso.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresa"
        description="Cadastre os dados institucionais que dão contexto ao financeiro, documentos fiscais e portal do cliente."
      />

      {getMessage(status, message)}

      <Card>
        <CardHeader>
          <CardTitle>Dados institucionais</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveCompanyProfile} className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="legalName" className="text-sm font-medium text-slate-700">Razão social</label>
                <Input id="legalName" name="legalName" defaultValue={profile?.legalName ?? ""} required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="tradeName" className="text-sm font-medium text-slate-700">Nome fantasia</label>
                <Input id="tradeName" name="tradeName" defaultValue={profile?.tradeName ?? ""} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-2">
                <label htmlFor="document" className="text-sm font-medium text-slate-700">CNPJ</label>
                <Input id="document" name="document" defaultValue={profile?.document ?? ""} required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="stateRegistration" className="text-sm font-medium text-slate-700">Inscrição estadual</label>
                <Input id="stateRegistration" name="stateRegistration" defaultValue={profile?.stateRegistration ?? ""} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="municipalRegistration" className="text-sm font-medium text-slate-700">Inscrição municipal</label>
                <Input id="municipalRegistration" name="municipalRegistration" defaultValue={profile?.municipalRegistration ?? ""} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-2">
                <label htmlFor="financialEmail" className="text-sm font-medium text-slate-700">E-mail financeiro</label>
                <Input id="financialEmail" name="financialEmail" type="email" defaultValue={profile?.financialEmail ?? ""} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium text-slate-700">Telefone</label>
                <PhoneInput id="phone" name="phone" defaultValue={profile?.phone ?? ""} placeholder="(00) 00000-0000" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="website" className="text-sm font-medium text-slate-700">Site</label>
                <Input id="website" name="website" defaultValue={profile?.website ?? ""} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="addressLine1" className="text-sm font-medium text-slate-700">Endereço</label>
                <Input id="addressLine1" name="addressLine1" defaultValue={profile?.addressLine1 ?? ""} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="addressLine2" className="text-sm font-medium text-slate-700">Complemento</label>
                <Input id="addressLine2" name="addressLine2" defaultValue={profile?.addressLine2 ?? ""} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-2">
                <label htmlFor="city" className="text-sm font-medium text-slate-700">Cidade</label>
                <Input id="city" name="city" defaultValue={profile?.city ?? ""} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="state" className="text-sm font-medium text-slate-700">UF</label>
                <Input id="state" name="state" defaultValue={profile?.state ?? ""} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="postalCode" className="text-sm font-medium text-slate-700">CEP</label>
                <Input id="postalCode" name="postalCode" defaultValue={profile?.postalCode ?? ""} />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="notes" className="text-sm font-medium text-slate-700">Observações</label>
              <Textarea id="notes" name="notes" defaultValue={profile?.notes ?? ""} />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Salvar dados da empresa</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
