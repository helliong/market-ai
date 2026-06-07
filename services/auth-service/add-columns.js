const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "birthDate" TIMESTAMP(3), ADD COLUMN "gender" TEXT;`);
  console.log("Migration successful!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
