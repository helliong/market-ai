FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
ENV DATABASE_URL=postgresql://marketai:password@localhost:5432/market_ai_db?schema=public
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

CMD ["node", "dist/src/main"]
