import { FileText } from "lucide-react";

import { fiscalDocumentTypeLabel } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FiscalDocument } from "@/types";

export function PortalDocumentList({ documents }: { documents: FiscalDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
        Nenhum documento fiscal disponível no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {documents.map((document) => (
        <a
          key={document.id}
          href={document.filePath}
          target="_blank"
          rel="noreferrer"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/40 sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {fiscalDocumentTypeLabel[document.type]}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">
                {document.number}
                {document.series ? ` • Série ${document.series}` : ""}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Emitido em {formatDate(document.issueDate)}
                {document.totalAmount !== undefined ? ` • ${formatCurrency(document.totalAmount)}` : ""}
              </p>
            </div>
            <div className="rounded-full bg-slate-100 p-3 text-slate-700">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          {document.notes ? <p className="mt-4 text-sm leading-6 text-slate-600">{document.notes}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {document.links.map((link) => (
              <span
                key={link.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {link.label ??
                  (link.ticketId
                    ? "Chamado vinculado"
                    : link.saleId
                      ? "Venda vinculada"
                      : link.monthlyBillingId
                        ? "Mensalidade vinculada"
                        : link.rentalBillingId
                          ? "Locação vinculada"
                          : "Documento relacionado")}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  );
}
