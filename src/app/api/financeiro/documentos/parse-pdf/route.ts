import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fiscal");

function extractFields(text: string) {
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Tipo
  let type = "OUTRO";
  if (/NFS?\s*-?\s*e\b/i.test(t)) type = "NFSE";
  else if (/NF\s*-?\s*e\b/i.test(t)) type = "NFE";
  else if (/recibo/i.test(t)) type = "RECIBO";

  // Número
  let number: string | null = null;
  for (const pattern of [
    /n[uú]mero\s*[:\-]?\s*([\d.]+)/i,
    /nota\s+fiscal\s+n[º°.]?\s*([\d.]+)/i,
    /\bn[º°.]\s*([\d.]+)/i,
    /number\s*[:\-]?\s*([\d.]+)/i,
    /^([\d.]{3,})\s*$/m
  ]) {
    const m = t.match(pattern);
    if (m) { number = m[1].replace(/\./g, ""); break; }
  }

  // Série
  let series: string | null = null;
  const seriesMatch = t.match(/s[eé]rie\s*[:\-]?\s*([A-Z0-9]{1,10})/i);
  if (seriesMatch) series = seriesMatch[1];

  // Data de emissão
  let issueDate: string | null = null;
  for (const pattern of [
    /emiss[aã]o\s*[:\-]?\s*(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/i,
    /data\s+[:\-]?\s*(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/i,
    /(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/
  ]) {
    const m = t.match(pattern);
    if (m) { issueDate = `${m[3]}-${m[2]}-${m[1]}`; break; }
  }

  // Valor total
  let totalAmount: number | null = null;
  for (const pattern of [
    /valor\s+total\s*[:\-]?\s*R?\$?\s*([\d.,]+)/i,
    /total\s+geral\s*[:\-]?\s*R?\$?\s*([\d.,]+)/i,
    /total\s*[:\-]?\s*R?\$?\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)/i
  ]) {
    const m = t.match(pattern);
    if (m) {
      const raw = m[1].trim();
      const normalized =
        raw.includes(",") && raw.includes(".")
          ? raw.replace(".", "").replace(",", ".") // 1.670,00 → 1670.00
          : raw.includes(",")
          ? raw.replace(",", ".") // 670,00 → 670.00
          : raw;
      const parsed = parseFloat(normalized);
      if (!isNaN(parsed)) { totalAmount = parsed; break; }
    }
  }

  return { type, number, series, issueDate, totalAmount };
}

export async function POST(request: Request) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ success: false, message: "Formato inválido. Envie um arquivo PDF." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: "O arquivo não pode ultrapassar 10 MB." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Save file to disk
    await mkdir(UPLOAD_DIR, { recursive: true });
    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${randomUUID()}_${safeOriginalName}`;
    const absolutePath = path.join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/fiscal/${filename}`;
    await writeFile(absolutePath, bytes);

    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(bytes));
    const normalizedText = Array.isArray(text) ? text.join("\n") : text;

    const extracted = extractFields(normalizedText);

    return NextResponse.json({
      success: true,
      filePath: publicPath,
      fileName: file.name,
      extracted
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao processar o PDF." },
      { status: 500 }
    );
  }
}
