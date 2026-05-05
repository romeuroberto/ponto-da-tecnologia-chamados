-- CreateTable
CREATE TABLE "TicketCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "suggestedRole" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketCategory_name_key" ON "TicketCategory"("name");

-- Seed default categories (idempotent)
INSERT INTO "TicketCategory" ("id", "name", "label", "suggestedRole", "active", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'E-mail',               'E-mail',               'ATTENDANT',  true, 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'Acesso e cadastro',     'Acesso e cadastro',     'ATTENDANT',  true, 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'Rede e infraestrutura', 'Rede e infraestrutura', 'TECHNICIAN', true, 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'Hardware',              'Hardware',              'TECHNICIAN', true, 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'Software',              'Software',              'TECHNICIAN', true, 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'Impressora',            'Impressora',            'TECHNICIAN', true, 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'PDV',                   'PDV',                   'TECHNICIAN', true, 7, NOW(), NOW()),
  (gen_random_uuid()::text, 'Telefonia',             'Telefonia',             'TECHNICIAN', true, 8, NOW(), NOW()),
  (gen_random_uuid()::text, 'Outros',                'Outros',                NULL,         true, 9, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
