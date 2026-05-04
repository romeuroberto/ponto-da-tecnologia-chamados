import { Landmark, QrCode } from "lucide-react";

import { PortalCopyField } from "@/components/portal/portal-copy-field";
import type { PaymentInstruction } from "@/types";

export function PortalPaymentInstructions({ instructions }: { instructions: PaymentInstruction[] }) {
  if (instructions.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
        Nenhuma instrução de pagamento cadastrada no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {instructions.map((instruction) => (
        <div key={instruction.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">{instruction.paymentChannel}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">{instruction.title}</h3>
            </div>
            <div className="rounded-full bg-slate-100 p-3 text-slate-700">
              {instruction.pixKey || instruction.pixCopyPaste ? <QrCode className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {instruction.pixKey ? <PortalCopyField label="Chave Pix" value={instruction.pixKey} /> : null}
            {instruction.pixCopyPaste ? <PortalCopyField label="Pix copia e cola" value={instruction.pixCopyPaste} /> : null}

            {instruction.qrCodeImagePath ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">QR Code</p>
                <img
                  src={instruction.qrCodeImagePath}
                  alt={`QR Code ${instruction.title}`}
                  className="mt-3 h-48 w-48 rounded-2xl border border-slate-200 bg-white object-contain"
                />
              </div>
            ) : null}

            {instruction.bankName || instruction.bankAgency || instruction.bankAccount ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Dados bancários</p>
                <div className="mt-3 space-y-1.5">
                  {instruction.bankName ? <p>Banco: {instruction.bankName}</p> : null}
                  {instruction.bankAgency ? <p>Agência: {instruction.bankAgency}</p> : null}
                  {instruction.bankAccount ? <p>Conta: {instruction.bankAccount}</p> : null}
                  {instruction.accountHolder ? <p>Favorecido: {instruction.accountHolder}</p> : null}
                  {instruction.accountDocument ? <p>Documento: {instruction.accountDocument}</p> : null}
                </div>
              </div>
            ) : null}

            {instruction.notes ? <p className="text-sm leading-6 text-slate-600">{instruction.notes}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
