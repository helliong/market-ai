CREATE TABLE IF NOT EXISTS "CartItem" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FavoriteItem" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FavoriteItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompareItem" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CompareItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_accountId_productId_key"
  ON "CartItem"("accountId", "productId");

CREATE INDEX IF NOT EXISTS "CartItem_accountId_idx"
  ON "CartItem"("accountId");

CREATE UNIQUE INDEX IF NOT EXISTS "FavoriteItem_accountId_productId_key"
  ON "FavoriteItem"("accountId", "productId");

CREATE INDEX IF NOT EXISTS "FavoriteItem_accountId_idx"
  ON "FavoriteItem"("accountId");

CREATE UNIQUE INDEX IF NOT EXISTS "CompareItem_accountId_productId_key"
  ON "CompareItem"("accountId", "productId");

CREATE INDEX IF NOT EXISTS "CompareItem_accountId_idx"
  ON "CompareItem"("accountId");
