ALTER TABLE "User"
ADD COLUMN "email" TEXT;

UPDATE "User"
SET "email" = "Account"."email"
FROM "Account"
WHERE "User"."accountId" = "Account"."id";

ALTER TABLE "User"
ALTER COLUMN "email" SET NOT NULL;

ALTER TABLE "UserSeller"
ADD COLUMN "email" TEXT;

UPDATE "UserSeller"
SET "email" = COALESCE("UserSeller"."ownerEmail", "Account"."email")
FROM "Account"
WHERE "UserSeller"."accountId" = "Account"."id";

ALTER TABLE "UserSeller"
ALTER COLUMN "email" SET NOT NULL;
