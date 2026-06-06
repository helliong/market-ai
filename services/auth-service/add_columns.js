const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "UserSeller" ADD COLUMN IF NOT EXISTS "description" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "UserSeller" ADD COLUMN IF NOT EXISTS "city" TEXT;`);
  console.log('Columns added successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
