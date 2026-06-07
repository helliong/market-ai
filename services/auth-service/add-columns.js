const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "UserSeller" ADD COLUMN "isPaused" BOOLEAN NOT NULL DEFAULT false;');
  await prisma.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN "isSellerPaused" BOOLEAN NOT NULL DEFAULT false;');
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
