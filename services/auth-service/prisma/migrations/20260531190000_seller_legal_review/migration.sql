ALTER TYPE "SellerStatus" RENAME TO "SellerStatus_old";

CREATE TYPE "SellerStatus" AS ENUM (
  'PENDING_LEGAL_DATA',
  'UNDER_REVIEW',
  'ACTIVATED',
  'SUSPENDED',
  'REJECTED'
);

ALTER TABLE "UserSeller" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "UserSeller"
  ALTER COLUMN "status" TYPE "SellerStatus"
  USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'PENDING_LEGAL_DATA'
      WHEN 'ACTIVE' THEN 'ACTIVATED'
      ELSE "status"::text
    END
  )::"SellerStatus";

ALTER TABLE "UserSeller"
  ALTER COLUMN "status" SET DEFAULT 'PENDING_LEGAL_DATA';

DROP TYPE "SellerStatus_old";

ALTER TABLE "UserSeller"
  ADD COLUMN "ownerEmail" TEXT,
  ADD COLUMN "ownerName" TEXT,
  ADD COLUMN "reviewComment" TEXT,
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

UPDATE "UserSeller"
SET
  "ownerEmail" = "Account"."email",
  "ownerName" = "UserSeller"."storeName"
FROM "Account"
WHERE "UserSeller"."accountId" = "Account"."id";

ALTER TABLE "UserSeller"
  ALTER COLUMN "ownerEmail" SET NOT NULL,
  ALTER COLUMN "ownerName" SET NOT NULL;

CREATE TABLE "SellerLegalProfile" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "businessType" TEXT NOT NULL,
  "taxId" TEXT NOT NULL,
  "legalName" TEXT NOT NULL,
  "legalAddress" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "iban" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SellerLegalProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SellerLegalProfile_sellerId_key" ON "SellerLegalProfile"("sellerId");

ALTER TABLE "SellerLegalProfile"
  ADD CONSTRAINT "SellerLegalProfile_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "UserSeller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
