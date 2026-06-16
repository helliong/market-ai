CREATE TABLE "AiChatSession" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "guestId" TEXT,
    "title" TEXT,
    "state" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "products" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiChatSession_accountId_updatedAt_idx" ON "AiChatSession"("accountId", "updatedAt");
CREATE INDEX "AiChatSession_guestId_updatedAt_idx" ON "AiChatSession"("guestId", "updatedAt");
CREATE INDEX "AiChatSession_updatedAt_idx" ON "AiChatSession"("updatedAt");
CREATE INDEX "AiChatMessage_sessionId_createdAt_idx" ON "AiChatMessage"("sessionId", "createdAt");

ALTER TABLE "AiChatMessage" ADD CONSTRAINT "AiChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
