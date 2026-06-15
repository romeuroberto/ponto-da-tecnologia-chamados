"use client";

import { useRef, useState } from "react";
import { NfPdfUploader } from "@/components/fiscal/nf-pdf-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { portalTicketStatusLabel, financialStatusLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Ticket, Sale } from "@/types";

type MonthlyBillingOption = {
  id: string;
  contractNumber: string;
  referenceMonth: number;
  referenceYear: number;
  amount: number;
  financialStatus: string;
};

type RentalBillingOption = {
  id: string;
  contractNumber: string;
  referenceMonth: number;
  referenceYear: number;
  amount: number;
  financialStatus: string;
  dueDate?: string;
};

interface FiscalDocumentFormProps {
  clientId: string;
  clientName: string;
  tickets: Ticket[];
  sales: Sale[];
  monthlyBillings: MonthlyBillingOption[];
  rentalBillings: RentalBillingOption[];
  createDocument: (formData: FormData) => Promise<void>;
}

export function FiscalDocumentForm({
  clientId,
  clientName,
  tickets,
  sales,
  monthlyBillings,
  rentalBillings,
  createDocument
}: FiscalDocumentFormProps) {
  const [type, setType] = useState("NFSE");
  const [number, setNumber] = useState("");
  const [series, setSeries] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [pdfLoaded, setPdfLoaded] = useState(false);

  function handleExtracted(data: {
    type?: string;
    number?: string;
    series?: string | null;
    issueDate?: string;
    totalAmount?: number | null;
    filePath: string;
    fileName: string;
  }) {
    if (data.type) setType(data.type);
    if (data.number) setNumber(data.number);
    if (data.series != null) setSeries(data.series ?? "");
    if (data.issueDate) setIssueDate(data.issueDate);
    if (data.totalAmount != null) setTotalAmount(String(data.totalAmount).replace(".", ","));
    setFileName(data.fileName);
    setFilePath(data.filePath);
    setPdfLoaded(true);
  }

  return (
    <form action={createDocument} className="grid gap-5">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Cliente selecionado: <span className="font-semibold text-slate-900">{clientName}</span>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Arquivo da nota fiscal (PDF)</label>
        <NfPdfUploader onExtracted={handleExtracted} />
        <input type="hidden" name="fileName" value={fileName} />
        <input type="hidden" name="filePath" value={filePath} />
      </div>

      <div className={`grid gap-5 transition-opacity ${!pdfLoaded ? "opacity-50" : ""}`}>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          {pdfLoaded
            ? "Confira os dados extraídos e ajuste se necessário antes de lançar."
            : "Faça o upload da NF acima para preencher automaticamente."}
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Tipo</label>
            <Select name="type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="NFSE">NFS-e</option>
              <option value="NFE">NF-e</option>
              <option value="RECIBO">Recibo</option>
              <option value="OUTRO">Outro</option>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Número</label>
            <Input name="number" required value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Série</label>
            <Input name="series" value={series} onChange={(e) => setSeries(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Data de emissão</label>
            <Input name="issueDate" type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Valor total</label>
            <Input name="totalAmount" placeholder="0,00" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
          </div>
          <div className="col-span-2 grid gap-2">
            <label className="text-sm font-medium text-slate-700">Observações</label>
            <Textarea name="notes" />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">Chamados para agrupar</h3>
            <p className="mt-1 text-sm text-slate-500">Selecione um ou mais chamados para vincular ao documento.</p>
            <div className="mt-4 max-h-72 space-y-2 overflow-auto pr-2">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
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

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">Mensalidades para agrupar</h3>
            <p className="mt-1 text-sm text-slate-500">Selecione cobranças recorrentes de contrato cobertas pelo documento.</p>
            <div className="mt-4 max-h-72 space-y-2 overflow-auto pr-2">
              {monthlyBillings.length > 0 ? (
                monthlyBillings.map((billing) => (
                  <label key={billing.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                    <input type="checkbox" name="monthlyBillingIds" value={billing.id} className="mt-1" />
                    <span>
                      <span className="font-semibold text-slate-950">
                        {String(billing.referenceMonth).padStart(2, "0")}/{billing.referenceYear}
                      </span>
                      <span className="block text-slate-600">Contrato {billing.contractNumber}</span>
                      <span className="block text-xs text-slate-400">
                        Status: {financialStatusLabel[billing.financialStatus as keyof typeof financialStatusLabel]} · {formatCurrency(billing.amount)}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhuma mensalidade encontrada para este cliente.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">Locações para agrupar</h3>
            <p className="mt-1 text-sm text-slate-500">Inclua cobranças de equipamentos locados na mesma nota ou recibo.</p>
            <div className="mt-4 max-h-72 space-y-2 overflow-auto pr-2">
              {rentalBillings.length > 0 ? (
                rentalBillings.map((billing) => (
                  <label key={billing.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                    <input type="checkbox" name="rentalBillingIds" value={billing.id} className="mt-1" />
                    <span>
                      <span className="font-semibold text-slate-950">
                        {String(billing.referenceMonth).padStart(2, "0")}/{billing.referenceYear}
                      </span>
                      <span className="block text-slate-600">Contrato {billing.contractNumber}</span>
                      <span className="block text-xs text-slate-400">
                        Status: {financialStatusLabel[billing.financialStatus as keyof typeof financialStatusLabel]} · {formatCurrency(billing.amount)}
                        {billing.dueDate ? ` · Vence em ${formatDate(billing.dueDate)}` : ""}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhuma cobrança de locação encontrada para este cliente.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Lançar documento fiscal</Button>
        </div>
      </div>
    </form>
  );
}
