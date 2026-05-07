import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import React, { type ReactElement } from "react";

import { ReceiptDocument } from "@/lib/receipt-pdf";
import { requireApiUser } from "@/server/auth/api-guard";
import { billingService } from "@/server/services/billing-service";
import { clientService } from "@/server/services/client-service";
import { companyProfileService } from "@/server/services/company-profile-service";
import { fiscalDocumentService } from "@/server/services/fiscal-document-service";
import { ticketService } from "@/server/services/ticket-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id } = await context.params;

    const [ticket, billing, company] = await Promise.all([
      ticketService.getTicket(id),
      billingService.getTicketBilling(id),
      companyProfileService.getProfile()
    ]);

    if (!ticket) {
      return NextResponse.json({ success: false, message: "Chamado não encontrado." }, { status: 404 });
    }

    if (!billing) {
      return NextResponse.json(
        { success: false, message: "Este chamado ainda não possui dados financeiros." },
        { status: 422 }
      );
    }

    if (billing.financialStatus === "CANCELADO") {
      return NextResponse.json(
        { success: false, message: "Não é possível gerar recibo para um financeiro cancelado." },
        { status: 422 }
      );
    }

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Cadastre os dados da empresa antes de gerar recibos." },
        { status: 422 }
      );
    }

    const clients = await clientService.listClients();
    const client = clients.find((c) => c.id === ticket.clientId);

    async function toDataUri(relativePath?: string): Promise<string | undefined> {
      if (!relativePath) return undefined;
      const abs = path.join(process.cwd(), "public", relativePath.replace(/^\//, ""));
      if (!existsSync(abs)) return undefined;
      const buf = await readFile(abs);
      const ext = path.extname(abs).toLowerCase().replace(".", "");
      const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
      return `data:${mime};base64,${buf.toString("base64")}`;
    }

    const [logoDataUri, signatureDataUri] = await Promise.all([
      toDataUri(company.logoPath),
      toDataUri(company.signaturePath)
    ]);

    const issueDate = new Date().toISOString();
    const receiptNumber = `${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const fileName = `recibo-${receiptNumber}.pdf`;

    const entryTypeLabel: Record<string, string> = {
      LABOR: "Mão de obra",
      PART: "Material",
      TRAVEL: "Deslocamento",
      EXTRA: "Avulso",
      CONSULTING: "Consultoria",
      REMOTE_SUPPORT: "Suporte Remoto"
    };

    const receiptData = {
      documentType: "RECIBO" as const,
      receiptNumber,
      issueDate,
      company,
      logoDataUri,
      signatureDataUri,
      client: {
        name: ticket.clientName,
        document: client?.document,
        email: client?.email,
        phone: client?.phone
      },
      referenceLabel: ticket.number ? `Chamado #${String(ticket.number).padStart(4, "0")}` : "Chamado",
      referenceDescription: ticket.title,
      items: billing.entries
        .filter((e) => e.billable)
        .map((e) => ({
          description: e.description,
          typeLabel: entryTypeLabel[e.entryType] ?? e.entryType,
          quantity: e.quantity,
          unitPrice: e.unitPrice,
          totalPrice: e.totalPrice
        })),
      subtotalAmount: billing.subtotalAmount,
      discountAmount: billing.discountAmount,
      totalAmount: billing.totalAmount,
      isCortesia: billing.billingType === "CORTESIA",
      paymentMethod: billing.paymentMethod ?? undefined,
      paymentDate: billing.paymentDate ?? undefined,
      paymentReference: billing.paymentReference ?? undefined,
      notes: billing.internalNotes ?? undefined
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(ReceiptDocument, { data: receiptData }) as ReactElement<DocumentProps>
    );

    const relativeDir = path.join("uploads", "recibos", id);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);
    const absoluteFilePath = path.join(absoluteDir, fileName);
    const publicFilePath = `/${relativeDir.replaceAll("\\", "/")}/${fileName}`;

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absoluteFilePath, pdfBuffer);

    let fiscalDocumentId: string | undefined;
    try {
      const fiscalDoc = await fiscalDocumentService.create({
        clientId: ticket.clientId,
        type: "RECIBO",
        number: receiptNumber,
        issueDate,
        totalAmount: billing.billingType === "CORTESIA" ? 0 : billing.totalAmount,
        fileName,
        filePath: publicFilePath,
        ticketIds: [id],
        saleIds: []
      });
      fiscalDocumentId = fiscalDoc.id;
    } catch {
      // Log fiscal document failure but don't block PDF delivery
    }

    return NextResponse.json({ success: true, data: { filePath: publicFilePath, fiscalDocumentId } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao gerar o recibo." },
      { status: 500 }
    );
  }
}
