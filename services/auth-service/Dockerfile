FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Удаляем prisma.config.ts, чтобы не требовал DATABASE_URL на этапе генерации
RUN rm -f prisma.config.ts
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]