import { prisma } from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/server/db-support";

export async function generateTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();

  if (!isDatabaseConfigured()) {
    return `CH-${year}-${Date.now().toString().slice(-4)}`;
  }

  const total = await prisma.ticket.count();
  return `CH-${year}-${String(total + 1).padStart(3, "0")}`;
}

