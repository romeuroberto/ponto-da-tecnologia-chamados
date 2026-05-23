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


export async function generateServiceOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();

  if (!isDatabaseConfigured()) {
    return `OS-${year}-${Date.now().toString().slice(-4)}`;
  }

  const total = await prisma.serviceOrder.count();
  return `OS-${year}-${String(total + 1).padStart(3, "0")}`;
}

export async function generateSaleNumber() {
  const now = new Date();
  const year = now.getFullYear();

  const total = await prisma.sale.count();
  return `VD-${year}-${String(total + 1).padStart(3, "0")}`;
}

export async function generateContractNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const total = await prisma.rentalContract.count();
  return `LOC-${year}-${String(total + 1).padStart(3, "0")}`;
}

export async function generatePatrimonyCode() {
  const total = await prisma.equipment.count();
  return `PAT-${String(total + 1).padStart(4, "0")}`;
}