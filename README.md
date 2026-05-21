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

```txt
marketplace-ai/
├── apps/
│   ├── client/
│   └── admin/
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── catalog-service/
│   ├── cart-service/
│   ├── order-service/
│   └── ai-agent-service/
├── packages/
├── infra/
├── docs/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── CHANGELOG.md
```

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


## АНАЛИТИЧЕСКАЯ ЧАСТЬ

```txt

# Аналитическая часть проекта MarketAI

# 1. Общая информация о проекте

## Название проекта

MarketAI — интеллектуальный маркетплейс с AI-ассистентом.

## Описание проекта

MarketAI представляет собой современный интернет-магазин с интегрированным AI-ассистентом, который помогает пользователям искать товары, сравнивать характеристики, анализировать цены и подбирать наиболее подходящие варианты.

Проект разрабатывается как микросервисная система с разделением на frontend, backend и инфраструктурную части.

Основная цель проекта — создание масштабируемой платформы, приближенной по архитектуре к современным production-решениям уровня Ozon, Wildberries и Яндекс Маркета.

---

# 2. Цель проекта

Целью проекта является разработка интеллектуального маркетплейса с AI-помощником, обеспечивающего:

* быстрый поиск товаров;
* рекомендации на основе пользовательских запросов;
* сравнение товаров;
* управление корзиной и избранным;
* удобную административную панель;
* масштабируемую микросервисную архитектуру.

---

# 3. Задачи проекта

Для достижения поставленной цели были определены следующие задачи:

1. Разработать клиентскую часть приложения.
2. Разработать административную панель.
3. Реализовать backend-архитектуру на основе микросервисов.
4. Настроить инфраструктуру с использованием Docker.
5. Реализовать взаимодействие между сервисами.
6. Подключить PostgreSQL и Redis.
7. Реализовать систему авторизации пользователей.
8. Реализовать корзину, избранное и сравнение товаров.
9. Подготовить AI-модуль рекомендаций.
10. Подготовить систему к последующему развертыванию в Kubernetes/k3s.

---

# 4. Актуальность проекта

Современные маркетплейсы ежедневно обрабатывают большое количество пользовательских запросов и товаров. Пользователи сталкиваются со следующими проблемами:

* сложность выбора товаров;
* большое количество одинаковых предложений;
* необходимость ручного сравнения характеристик;
* перегруженные интерфейсы.

Использование AI-ассистента позволяет значительно упростить процесс выбора товаров и повысить удобство взаимодействия с системой.

Кроме того, применение микросервисной архитектуры обеспечивает:

* масштабируемость;
* отказоустойчивость;
* удобство поддержки;
* независимое развитие сервисов.

---

# 5. Архитектура проекта

Проект построен на микросервисной архитектуре.

Система состоит из следующих частей:

* frontend клиентского приложения;
* frontend административной панели;
* backend микросервисов;
* инфраструктурного уровня.

## Структура проекта


marketplace-ai/
├── apps/
│   ├── client/
│   └── admin/
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── catalog-service/
│   ├── cart-service/
│   ├── order-service/
│   └── ai-agent-service/
├── packages/
├── infra/
├── docs/
├── docker-compose.yml
├── .env.example
├── README.md
└── CHANGELOG.md

---

# 6. Используемые технологии

## Frontend Client

* Next.js
* TypeScript
* Tailwind CSS
* Redux Toolkit
* RTK Query
* Framer Motion

## Frontend Admin

* React
* Vite
* TypeScript
* Tailwind CSS
* Redux Toolkit
* PWA

## Backend

* NestJS
* Prisma ORM
* PostgreSQL
* Redis
* JWT Authentication
* Swagger/OpenAPI

## Infrastructure

* Docker
* Docker Compose
* PostgreSQL Container
* Redis Container

---

# 7. Обоснование выбора технологий

## Next.js

Next.js был выбран благодаря поддержке SSR и SEO-оптимизации, что особенно важно для интернет-магазинов.

## TypeScript

TypeScript обеспечивает строгую типизацию и снижает вероятность ошибок при разработке крупного проекта.

## NestJS

NestJS предоставляет модульную архитектуру и хорошо подходит для построения микросервисных backend-систем.

## PostgreSQL

PostgreSQL используется как основная реляционная база данных благодаря надежности и высокой производительности.

## Redis

Redis используется для кеширования, хранения временных данных и организации взаимодействия между сервисами.

## Prisma ORM

Prisma обеспечивает удобную работу с базой данных и типобезопасность запросов.

## Docker

Docker используется для контейнеризации и упрощения развертывания системы.

---

# 8. Реализованный функционал

На текущем этапе проекта реализованы:

## Клиентский frontend

* главная страница;
* современный UI маркетплейса;
* header;
* hero section;
* категории товаров;
* карточки товаров;
* AI widget;
* корзина;
* избранное;
* сравнение товаров;
* Redux store.

## Backend

* создание auth-service;
* настройка Prisma;
* подключение PostgreSQL;
* подключение Redis;
* настройка Docker Compose.

## Infrastructure

* запуск PostgreSQL контейнера;
* запуск Redis контейнера;
* настройка environment variables;
* настройка Docker volumes.

---

# 9. Перспективы развития проекта

В дальнейшем планируется реализовать:

* полноценную AI-рекомендательную систему;
* чат с AI-ассистентом;
* систему оплаты;
* систему заказов;
* уведомления;
* аналитику;
* Kubernetes/k3s deployment;
* CI/CD pipeline;
* систему мониторинга.

---

# 10. Заключение

В ходе разработки проекта MarketAI была спроектирована современная микросервисная архитектура интеллектуального маркетплейса.

Использование современных технологий frontend и backend разработки позволяет создать масштабируемую и производительную систему.

Разрабатываемая платформа может служить основой для дальнейшего развития полноценного production-решения с AI-функционалом.


```


## ПРОМПТ ДЛЯ ВАШЕГО ЧАТА ИИ, ЧТОБЫ ОН ВТЯНУЛСЯ В ПРОЕКТ

```txt

Я разрабатываю большой AI marketplace / интернет-магазин с AI-ассистентом по типу Яндекс Маркета + Алисы. Проект строится на микросервисной архитектуре.

Основная идея:
- маркетплейс с товарами
- AI-ассистент помогает искать товары, сравнивать, рекомендовать
- отдельная админка
- полноценная backend инфраструктура
- Redis + PostgreSQL + Docker + NestJS
- клиентский frontend на Next.js

Текущий стек проекта:

Frontend Client:
- Next.js
- TypeScript
- Tailwind CSS
- Redux Toolkit
- RTK Query

Frontend Admin:
- React
- Vite
- TypeScript
- Tailwind CSS
- Redux Toolkit
- PWA

Backend:
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- JWT Auth
- Swagger/OpenAPI

Infrastructure:
- Docker
- Docker Compose
- PostgreSQL Container
- Redis Container

Архитектура проекта:

marketplace-ai/
├── apps/
│   ├── client/
│   └── admin/
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── catalog-service/
│   ├── cart-service/
│   ├── order-service/
│   └── ai-agent-service/
├── packages/
├── infra/
├── docs/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── CHANGELOG.md

Что уже сделано:

Infrastructure:
- настроен docker-compose
- поднят PostgreSQL
- поднят Redis
- настроены volumes
- настроены env variables
- создан .env.example
- настроен .gitignore

Backend:
- создан auth-service на NestJS
- установлен Prisma 7
- настроен PostgreSQL connection
- настроен Prisma через @prisma/adapter-pg
- создан PrismaModule
- создан PrismaService
- создан AuthModule
- создан AuthController
- создан AuthService
- NestJS сервис успешно запускается

Также уже созданы:
- api-gateway
- catalog-service
- cart-service
- order-service
- ai-agent-service

Docker:
- PostgreSQL работает на 5433 -> 5432
- Redis работает на 6379

Текущая DATABASE_URL:

postgresql://marketai:marketai_password@127.0.0.1:5433/market_ai_db?schema=public

Важный момент:
Из-за Prisma 7 пришлось использовать:
- @prisma/adapter-pg
- pg
- PrismaClient с adapter

Текущий PrismaService:

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

Что планируется дальше:
1. Register endpoint
2. Login endpoint
3. JWT Auth
4. bcrypt password hashing
5. Guards
6. Swagger
7. Product schema
8. Catalog service
9. AI recommendations
10. Cart and Orders
11. Admin dashboard
12. Kubernetes/k3s deployment

Важно:
- проект учебный, но делается максимально production-like
- структура и архитектура должны выглядеть как реальный enterprise marketplace
- AI-агент должен быть похож на AI-помощника Яндекс Маркета
- frontend дизайн ориентирован на Ozon / WB / Яндекс Маркет

```
