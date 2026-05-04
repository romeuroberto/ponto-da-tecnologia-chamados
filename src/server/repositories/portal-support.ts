import { Prisma } from "@prisma/client";

export function isMissingTableError(error: unknown, tableName: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    error.message.includes(tableName)
  );
}
