import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { TicketAttachment } from "@/types";

function formatSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketAttachments({ attachments }: { attachments: TicketAttachment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {attachments.length > 0 ? (
          attachments.map((attachment) => (
            <div key={attachment.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-950">{attachment.fileName}</p>
                  <p className="text-sm text-slate-600">
                    {formatSize(attachment.sizeBytes)} • {formatDate(attachment.createdAt)}
                  </p>
                </div>
                <a href={attachment.filePath} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-700">
                  Abrir anexo
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-600">Nenhum anexo enviado para este chamado.</p>
        )}
      </CardContent>
    </Card>
  );
}
