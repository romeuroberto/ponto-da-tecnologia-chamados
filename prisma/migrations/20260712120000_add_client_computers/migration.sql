-- CreateEnum
CREATE TYPE "RemoteAccessTool" AS ENUM ('ANYDESK', 'TEAMVIEWER', 'RUSTDESK', 'CHROME_REMOTE_DESKTOP', 'WINDOWS_RDP', 'OTHER');

-- CreateTable
CREATE TABLE "ClientComputer" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "responsibleName" TEXT,
    "remoteTool" "RemoteAccessTool" NOT NULL,
    "remoteCode" TEXT,
    "remotePassword" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientComputer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientComputer_clientId_active_name_idx" ON "ClientComputer"("clientId", "active", "name");

-- AddForeignKey
ALTER TABLE "ClientComputer" ADD CONSTRAINT "ClientComputer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
