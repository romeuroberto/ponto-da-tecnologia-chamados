import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import React, { type ReactElement } from "react";

import { ReceiptDocument } from "@/lib/receipt-pdf";
import { requireApiUser } from "@/server/auth/api-guard";
import { clientService } from "@/server/services/client-service";
import { companyProfileService } from "@/server/services/company-profile-service";
import { fiscalDocumentService } from "@/server/services/fiscal-document-service";
import { saleService } from "@/server/services/sale-service";

async function toDataUri(relativePath?: string): Promise<string | undefined> {
  if (!relativePath) return undefined;
  const abs = path.join(process.cwd(), "public", relativePath.replace(/^\//, ""));
  if (!existsSync(abs)) return undefined;
  const buf = await readFile(abs);
  const ext = path.extname(abs).toLowerCase().replace(".", "");
  const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    const { id } = await context.params;

    const [sale, company] = await Promise.all([saleService.getSale(id), companyProfileService.getProfile()]);

    if (!sale) {
      return NextResponse.json({ success: false, message: "Venda não encontrada." }, { status: 404 });
    }

    if (sale.financialStatus === "CANCELADO") {
      return NextResponse.json(
        { success: false, message: "Não é possível gerar recibo para uma venda cancelada." },
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
    const client = clients.find((c) => c.id === sale.clientId);

    const [logoDataUri, signatureDataUri] = await Promise.all([
      toDataUri(company.logoPath),
      toDataUri(company.signaturePath)
    ]);

    const issueDate = new Date().toISOString();
    const receiptNumber = `${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const fileName = `recibo-${receiptNumber}.pdf`;

    const receiptData = {
      documentType: "RECIBO" as const,
      receiptNumber,
      issueDate,
      company,
      logoDataUri,
      signatureDataUri,
      client: {
        name: sale.clientName,
        document: client?.document,
        email: client?.email,
        phone: client?.phone
      },
      referenceLabel: `Venda ${sale.number}`,
      items: sale.items.map((item) => ({
        description: item.partName + (item.partCode ? ` (${item.partCode})` : ""),
        typeLabel: "Material",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      subtotalAmount: sale.totalAmount,
      discountAmount: 0,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      paymentDate: sale.paymentDate,
      paymentReference: sale.paymentReference ?? undefined,
      notes: sale.internalNotes ?? undefined
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(ReceiptDocument, { data: receiptData }) as ReactElement<DocumentProps>
    );

    const relativeDir = path.join("uploads", "recibos", "vendas", id);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);
    const absoluteFilePath = path.join(absoluteDir, fileName);
    const publicFilePath = `/${relativeDir.replaceAll("\\", "/")}/${fileName}`;

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absoluteFilePath, pdfBuffer);

    const fiscalDoc = await fiscalDocumentService.create({
      clientId: sale.clientId,
      type: "RECIBO",
      number: receiptNumber,
      issueDate,
      totalAmount: sale.totalAmount,
      fileName,
      filePath: publicFilePath,
      ticketIds: [],
      saleIds: [id]
    });

    return NextResponse.json({ success: true, data: { filePath: publicFilePath, fiscalDocumentId: fiscalDoc.id } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao gerar o recibo." },
      { status: 500 }
    );
  }
}
