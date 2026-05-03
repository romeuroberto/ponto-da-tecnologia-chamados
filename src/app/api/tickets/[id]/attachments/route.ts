import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { ticketService } from "@/server/services/ticket-service";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiUser(["ADMIN", "ATTENDANT", "TECHNICIAN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhum arquivo enviado."
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "O arquivo enviado esta vazio."
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "O arquivo excede o limite de 5 MB."
        },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = path.extname(file.name);
    const safeName = sanitizeFileName(path.basename(file.name, extension));
    const generatedName = `${safeName}-${randomUUID()}${extension}`;
    const relativeDirectory = path.join("uploads", "tickets", id);
    const absoluteDirectory = path.join(process.cwd(), "public", relativeDirectory);
    const absoluteFilePath = path.join(absoluteDirectory, generatedName);
    const publicFilePath = `/${relativeDirectory.replaceAll("\\", "/")}/${generatedName}`;

    await mkdir(absoluteDirectory, { recursive: true });
    await writeFile(absoluteFilePath, bytes);

    const ticket = await ticketService.addAttachment(
      id,
      {
        fileName: file.name,
        filePath: publicFilePath,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size
      },
      guard.user.id
    );

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Chamado não encontrado."
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: ticket
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Falha ao enviar anexo."
      },
      { status: 500 }
    );
  }
}
