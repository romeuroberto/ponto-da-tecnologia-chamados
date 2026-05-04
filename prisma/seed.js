const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: "admin@admin.com" } });

  if (existing) {
    console.log("Usuário admin já existe. Nenhuma alteração feita.");
    return;
  }

  const password = process.env.ADMIN_INITIAL_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@admin.com",
      passwordHash,
      role: "ADMIN"
    }
  });

  console.log("✅ Usuário admin criado.");
  console.log("   E-mail: admin@admin.com");
  console.log(`   Senha:  ${password}`);
  console.log("");
  console.log("⚠️  Altere a senha imediatamente após o primeiro acesso.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
