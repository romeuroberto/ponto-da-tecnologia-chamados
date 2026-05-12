import { mkdir, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { paymentInstructionService } from "@/server/services/payment-instruction-service";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "qrcodes");

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    const { id } = await context.params;
    const instruction = await paymentInstructionService.findById(id);
    if (!instruction) {
      return NextResponse.json({ success: false, message: "Instrução de pagamento não encontrada." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: "Formato inválido. Use PNG, JPG ou WEBP." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: "A imagem não pode ultrapassar 2 MB." }, { status: 400 });
    }

    const extension = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const filename = `qr-${id}${extension}`;
    const absolutePath = path.join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/qrcodes/${filename}`;

    await mkdir(UPLOAD_DIR, { recursive: true });

    // Remove versões antigas com outras extensões
    for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
      const old = path.join(UPLOAD_DIR, `qr-${id}${ext}`);
      if (existsSync(old) && old !== absolutePath) {
        await unlink(old).catch(() => null);
      }
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, bytes);

    await paymentInstructionService.updateQrCodePath(id, publicPath);

    return NextResponse.json({ success: true, qrCodeImagePath: publicPath });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao salvar QR code." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT"]);
    if ("error" in guard) return guard.error;

    const { id } = await context.params;

    for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
      const filePath = path.join(UPLOAD_DIR, `qr-${id}${ext}`);
      if (existsSync(filePath)) {
        await unlink(filePath).catch(() => null);
      }
    }

    await paymentInstructionService.updateQrCodePath(id, null);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao remover QR code." },
      { status: 500 }
    );
  }
}
