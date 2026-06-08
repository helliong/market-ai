CREATE TABLE IF NOT EXISTS "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ProductImage'
      AND column_name = 'id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE "ProductImage" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "ProductImage" ALTER COLUMN "id" TYPE TEXT USING "id"::text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ProductImage'
      AND column_name = 'updatedAt'
  ) THEN
    UPDATE "ProductImage"
    SET "updatedAt" = CURRENT_TIMESTAMP
    WHERE "updatedAt" IS NULL;

    ALTER TABLE "ProductImage" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProductImage_productId_fkey'
  ) THEN
    ALTER TABLE "ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
