CREATE TYPE "CredentialScope" AS ENUM ('BUYER', 'SELLER');

CREATE TABLE "AccountCredential" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "scope" "CredentialScope" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "resetCode" TEXT,
    "resetCodeExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountCredential_accountId_scope_key" ON "AccountCredential"("accountId", "scope");

ALTER TABLE "AccountCredential" ADD CONSTRAINT "AccountCredential_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Account" DROP COLUMN "passwordHash";
ALTER TABLE "Account" DROP COLUMN "refreshTokenHash";
