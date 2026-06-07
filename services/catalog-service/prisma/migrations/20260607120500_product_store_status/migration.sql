ALTER TABLE "Product" ADD COLUMN "storeStatus" TEXT NOT NULL DEFAULT 'ACTIVATED';

CREATE INDEX "Product_storeStatus_idx" ON "Product"("storeStatus");
