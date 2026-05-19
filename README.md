# MarketAI

Самописный AI marketplace / интернет-магазин с AI-ассистентом по типу Яндекс Маркета + Алисы.

---

# Архитектура проекта

Проект построен на микросервисной архитектуре.

## Основные части системы

- Клиентский frontend
- Админский frontend (PWA)
- Backend микросервисы
- Infrastructure layer

---

# Технологический стек

## Frontend Client

- Next.js
- TypeScript
- Tailwind CSS
- Redux Toolkit
- RTK Query

## Frontend Admin

- React
- Vite
- TypeScript
- Tailwind CSS
- Redux Toolkit
- PWA

## Backend

- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Swagger/OpenAPI

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL Container
- Redis Container

---

# Структура проекта

marketplace-ai/

├── apps/
│ ├── client/
│ └── admin/
│
├── services/
│ ├── api-gateway/
│ ├── auth-service/
│ ├── catalog-service/
│ ├── cart-service/
│ ├── order-service/
│ └── ai-agent-service/
│
├── packages/
├── infra/
├── docs/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── CHANGELOG.md

---

# Что уже реализовано

## Infrastructure

- Настроен Docker Compose
- Поднят PostgreSQL контейнер
- Поднят Redis контейнер
- Настроены volumes
- Настроены environment variables
- Добавлен `.env.example`
- Настроен `.gitignore`

## Backend

### Auth Service

- Создан NestJS `auth-service`
- Установлен Prisma
- Настроен Prisma 7
- Настроен PostgreSQL connection
- Настроен Prisma Adapter (`@prisma/adapter-pg`)
- Создан `PrismaModule`
- Создан `PrismaService`
- Создан `AuthModule`
- Создан `AuthController`
- Создан `AuthService`
- Подключён PrismaClient
- Проверен запуск NestJS сервиса

### Другие сервисы

Созданы:
- `api-gateway`
- `catalog-service`
- `cart-service`
- `order-service`
- `ai-agent-service`

---

# Используемые контейнеры

## PostgreSQL

Container: `market-ai-postgres`  
Port: `5433`  
Database: `market_ai_db`

## Redis

Container: `market-ai-redis`  
Port: `6379`

---

# Переменные окружения

## .env.example

POSTGRES_USER=marketai  
POSTGRES_PASSWORD=change_me  
POSTGRES_DB=market_ai_db

---

# Команды

## Запуск Docker Infrastructure

docker compose up -d

## Остановка контейнеров

docker compose down

## Проверка контейнеров

docker ps

## Запуск auth-service

cd services/auth-service  
npm run start:dev

## Prisma Studio

cd services/auth-service  
npx prisma studio

## Prisma Migration

npx prisma migrate dev --name init

---

# Проверка Redis

docker exec -it market-ai-redis redis-cli ping

Ожидаемый ответ:

PONG

---

# Что планируется дальше

## Auth

- Register endpoint
- Login endpoint
- JWT Access Token
- Refresh Token
- Password hashing (bcrypt)
- Guards
- Validation

## Catalog

- Product schema
- Categories
- Filters
- Search
- Product images

## AI Agent

- OpenAI integration
- Product recommendations
- AI assistant
- Similar products
- Smart search

## Cart & Orders

- Shopping cart
- Order creation
- Checkout
- Payment integration

## Admin Panel

- Dashboard
- Analytics
- Orders management
- Products management
- Users management

## Infrastructure

- Kubernetes / k3s
- CI/CD
- GitHub Actions
- Nginx
- Monitoring