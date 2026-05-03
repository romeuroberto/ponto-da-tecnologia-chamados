import { NextResponse } from "next/server";

import { requireApiUser } from "@/server/auth/api-guard";
import { dashboardService } from "@/server/services/dashboard-service";

export async function GET() {
  const guard = await requireApiUser();

  if ("error" in guard) {
    return guard.error;
  }

  return NextResponse.json({
    success: true,
    data: await dashboardService.getSummary()
  });
}
