ALTER TABLE "Product" ADD COLUMN "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

UPDATE "Product"
SET "sku" = 'PRODUCT-' || "id"
WHERE "sku" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
