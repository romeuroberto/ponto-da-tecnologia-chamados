import { mkdir, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { companyProfileService } from "@/server/services/company-profile-service";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const LOGO_DIR = path.join(process.cwd(), "public", "uploads", "company");
const LOGO_PUBLIC_PATH = "/uploads/company/logo";

export async function POST(request: Request) {
  try {
    const guard = await requireApiUser(["ADMIN"]);

    if ("error" in guard) {
      return guard.error;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Formato inválido. Use PNG, JPG, WEBP ou SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "A logo não pode ultrapassar 2 MB." },
        { status: 400 }
      );
    }

    const extension = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const publicFilePath = `${LOGO_PUBLIC_PATH}${extension}`;
    const absoluteFilePath = path.join(LOGO_DIR, `logo${extension}`);

    await mkdir(LOGO_DIR, { recursive: true });

    // Remove logos com outras extensões para evitar duplicatas
    for (const ext of [".png", ".jpg", ".jpeg", ".webp", ".svg"]) {
      const old = path.join(LOGO_DIR, `logo${ext}`);
      if (existsSync(old) && old !== absoluteFilePath) {
        await unlink(old).catch(() => null);
      }
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(absoluteFilePath, bytes);

    const profile = await companyProfileService.getProfile();
    await companyProfileService.saveProfile({
      legalName: profile?.legalName ?? "Empresa",
      tradeName: profile?.tradeName,
      document: profile?.document ?? "",
      stateRegistration: profile?.stateRegistration,
      municipalRegistration: profile?.municipalRegistration,
      financialEmail: profile?.financialEmail,
      phone: profile?.phone,
      website: profile?.website,
      addressLine1: profile?.addressLine1,
      addressLine2: profile?.addressLine2,
      city: profile?.city,
      state: profile?.state,
      postalCode: profile?.postalCode,
      notes: profile?.notes,
      logoPath: publicFilePath,
      signaturePath: profile?.signaturePath
    });

    return NextResponse.json({ success: true, logoPath: publicFilePath }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao salvar a logo." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const guard = await requireApiUser(["ADMIN"]);

    if ("error" in guard) {
      return guard.error;
    }

    for (const ext of [".png", ".jpg", ".jpeg", ".webp", ".svg"]) {
      const filePath = path.join(LOGO_DIR, `logo${ext}`);
      if (existsSync(filePath)) {
        await unlink(filePath).catch(() => null);
      }
    }

    const profile = await companyProfileService.getProfile();
    if (profile) {
      await companyProfileService.saveProfile({
        legalName: profile.legalName,
        tradeName: profile.tradeName,
        document: profile.document,
        stateRegistration: profile.stateRegistration,
        municipalRegistration: profile.municipalRegistration,
        financialEmail: profile.financialEmail,
        phone: profile.phone,
        website: profile.website,
        addressLine1: profile.addressLine1,
        addressLine2: profile.addressLine2,
        city: profile.city,
        state: profile.state,
        postalCode: profile.postalCode,
        notes: profile.notes,
        logoPath: undefined,
        signaturePath: profile.signaturePath
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Falha ao remover a logo." },
      { status: 500 }
    );
  }
}
