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

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Redux Toolkit
- React Redux
- Framer Motion
- Swiper
- Lucide React
- Zod
- Prisma Client 7

## Frontend Admin

- React 19
- Vite 8
- TypeScript 6
- Tailwind CSS 4
- Redux Toolkit
- React Redux
- ESLint

## Backend

- NestJS 11
- TypeScript 5
- Express Platform
- Prisma ORM 7
- PostgreSQL
- JWT authentication
- Passport / Passport JWT
- Cookie Parser
- Bcrypt
- Nodemailer
- Class Validator
- Class Transformer
- Swagger / OpenAPI
- NestJS Throttler
- Jest
- Supertest

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16
- Redis 7
- Docker volumes
- Docker bridge network

---

# Структура проекта

```txt
marketplace-ai/
├── apps/
│   ├── client/                    # Клиентский frontend на Next.js
│   │   ├── app/                    # App Router страницы
│   │   │   ├── agreement/
│   │   │   ├── cart/
│   │   │   ├── catalog/
│   │   │   ├── checkout/
│   │   │   ├── compare/
│   │   │   ├── favorites/
│   │   │   ├── login/
│   │   │   ├── products/[id]/
│   │   │   ├── profile/
│   │   │   ├── register/
│   │   │   └── seller/
│   │   ├── prisma/
│   │   ├── public/
│   │   └── src/
│   │       ├── components/
│   │       ├── data/
│   │       ├── lib/
│   │       └── store/
│   │
│   └── admin/                     # Админская панель на React + Vite
│       ├── public/
│       └── src/
│           ├── admin/
│           │   ├── components/
│           │   └── pages/
│           ├── agreement/
│           ├── assets/
│           ├── login/
│           └── register/
│
├── services/
│   ├── api-gateway/               # API Gateway
│   │   ├── src/
│   │   └── test/
│   │
│   ├── auth-service/              # Сервис авторизации
│   │   ├── prisma/
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   ├── dto/
│   │   │   │   ├── guards/
│   │   │   │   └── strategies/
│   │   │   ├── email/
│   │   │   └── prisma/
│   │   └── test/
│   │
│   ├── catalog-service/           # Сервис каталога товаров
│   │   ├── src/
│   │   └── test/
│   │
│   ├── cart-service/              # Сервис корзины
│   │   ├── src/
│   │   └── test/
│   │
│   ├── order-service/             # Сервис заказов
│   │   ├── src/
│   │   └── test/
│   │
│   └── ai-agent-service/          # AI-ассистент / рекомендательный сервис
│       ├── src/
│       └── test/
│
├── docker-compose.yml             # PostgreSQL, Redis и инфраструктура
├── .env.example                   # Пример переменных окружения
├── .gitignore
├── package-lock.json
└── README.md
```

---

# Что уже реализовано

## Infrastructure

- Настроен `docker-compose.yml`
- Поднят PostgreSQL 16 контейнер
- Поднят Redis 7 контейнер
- Настроен Docker volume для PostgreSQL
- Настроена Docker bridge network
- Добавлен контейнер для `auth-service`
- Добавлен `.env.example`
- Настроен `.gitignore`

## Frontend Client

- Создан клиентский frontend на Next.js
- Настроен App Router
- Реализована главная страница
- Реализован общий layout
- Реализованы header и footer
- Реализован hero section
- Реализован AI widget на главной странице
- Реализованы секции товаров
- Реализованы карточки товаров
- Реализована страница каталога
- Реализована страница товара по динамическому маршруту `/products/[id]`
- Реализована корзина
- Реализовано избранное
- Реализовано сравнение товаров
- Реализована страница оформления заказа
- Реализована страница профиля
- Реализованы страницы входа и регистрации клиента
- Реализованы страницы входа и регистрации продавца
- Реализована страница пользовательского соглашения
- Настроен Redux store
- Добавлены Redux slices для auth, cart, favorites и compare
- Добавлена интеграция с `auth-service` через `auth-api.ts`
- Добавлена поддержка светлой и темной темы

## Frontend Admin

- Создан admin frontend на React + Vite
- Реализована административная панель
- Реализован dashboard со статистикой
- Реализована страница управления товарами
- Реализовано добавление, редактирование и удаление товаров на уровне UI state
- Реализована страница заказов
- Реализовано изменение статуса заказа на уровне UI state
- Реализована страница пользователей
- Реализовано изменение роли и статуса пользователя на уровне UI state
- Реализованы модальные окна и dialog-компоненты
- Реализованы страницы входа и регистрации продавца
- Реализована страница соглашения продавца

## Backend

### Auth Service

- Создан NestJS `auth-service`
- Настроен Prisma 7
- Настроено подключение к PostgreSQL через `@prisma/adapter-pg`
- Создана Prisma schema с моделью `User`
- Создана миграция для модели пользователя
- Создан `PrismaModule`
- Создан `PrismaService`
- Создан `AuthModule`
- Создан `AuthController`
- Создан `AuthService`
- Реализована регистрация пользователя
- Реализована email verification через одноразовый код
- Реализован login
- Реализованы access и refresh JWT tokens
- Реализовано хранение refresh token hash в базе
- Реализован refresh tokens endpoint
- Реализован logout
- Реализован endpoint текущего пользователя `/auth/me`
- Реализована JWT guard
- Реализована JWT strategy
- Подключен `cookie-parser`
- Настроены HttpOnly cookies для токенов
- Настроен CORS для клиентского приложения
- Настроена глобальная валидация DTO
- Подключен `class-validator`
- Подключен `class-transformer`
- Подключен `bcrypt`
- Подключен `nodemailer`
- Создан `EmailModule`
- Создан `EmailService`
- Настроен Swagger/OpenAPI на `/docs`
- Настроен rate limiting через `@nestjs/throttler`
- Добавлены unit test/spec файлы

### Остальные сервисы

- Создан `api-gateway` как NestJS сервис-каркас
- Создан `catalog-service` как NestJS сервис-каркас
- Создан `cart-service` как NestJS сервис-каркас
- Создан `order-service` как NestJS сервис-каркас
- Создан `ai-agent-service` как NestJS сервис-каркас
- Для сервисов добавлены базовые `AppModule`, `AppController`, `AppService`
- Для сервисов добавлены e2e test конфиги

---

# Используемые контейнеры

## PostgreSQL

- Образ: `postgres:16`
- Container name: `market-ai-postgres`
- Порт: `5433:5432`
- Используется как основная база данных проекта
- Данные сохраняются в Docker volume `postgres_data`
- Подключен к сети `market-ai-network`

## Redis

- Образ: `redis:7`
- Container name: `market-ai-redis`
- Порт: `6379:6379`
- Используется для кеширования и временных данных
- Подключен к сети `market-ai-network`

## Auth Service

- Собирается из `./services/auth-service`
- Container name: `market-ai-auth`
- Порт: `4001:4001`
- Работает в `NODE_ENV=production`
- Подключается к PostgreSQL через внутренний host `postgres:5432`
- Использует переменные окружения для JWT и email
- Зависит от контейнеров `postgres` и `redis`
- Подключен к сети `market-ai-network`

## Docker volumes

- `postgres_data` — хранение данных PostgreSQL

## Docker networks

- `market-ai-network` — bridge network для связи контейнеров

---

# Переменные окружения

```env
POSTGRES_USER=marketai
POSTGRES_PASSWORD=change_me_password
POSTGRES_DB=market_ai_db

DATABASE_URL=postgresql://marketai:change_me_password@localhost:5433/market_ai_db?schema=public

JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

CLIENT_URL=http://localhost:3000
PORT=4001

NEXT_PUBLIC_AUTH_API_URL=http://localhost:4001
NEXT_PUBLIC_ADMIN_URL=http://localhost:5173

```

| Переменная | Пример значения | Назначение |
|---|---|---|
| `POSTGRES_USER` | `marketai` | Имя пользователя PostgreSQL |
| `POSTGRES_PASSWORD` | `change_me_password` | Пароль пользователя PostgreSQL |
| `POSTGRES_DB` | `market_ai_db` | Название базы данных PostgreSQL |
| `DATABASE_URL` | `postgresql://marketai:change_me_password@localhost:5433/market_ai_db?schema=public` | Строка подключения Prisma к PostgreSQL при локальном запуске |
| `JWT_ACCESS_SECRET` | `change_me_access_secret` | Секрет для подписи access token |
| `JWT_REFRESH_SECRET` | `change_me_refresh_secret` | Секрет для подписи refresh token |
| `EMAIL_USER` | `your_email@gmail.com` | Email для отправки кодов подтверждения |
| `EMAIL_PASS` | `your_gmail_app_password` | Пароль приложения для email-аккаунта |
| `CLIENT_URL` | `http://localhost:3000` | URL клиентского frontend для настройки CORS |
| `PORT` | `4001` | Порт запуска `auth-service` |
| `NEXT_PUBLIC_AUTH_API_URL` | `http://localhost:4001` | URL `auth-service` для клиентского frontend |
| `NEXT_PUBLIC_ADMIN_URL` | `http://localhost:5173` | URL админской панели |

---

# Команды

## Установка зависимостей

```bash
cd apps/client
npm install

cd ../admin
npm install

cd ../../services/auth-service
npm install
```

## Запуск Docker infrastructure

```bash
docker compose up -d
```

## Остановка контейнеров

```bash
docker compose down
```

## Проверка контейнеров

```bash
docker ps
```

## Проверка Redis

```bash
docker exec -it market-ai-redis redis-cli ping
```

Ожидаемый ответ:

```bash
PONG
```

## Запуск client frontend

```bash
cd apps/client
npm run dev
```

Client frontend запускается на:

```txt
http://127.0.0.1:3000
```

## Запуск admin frontend

```bash
cd apps/admin
npm run dev
```

Admin frontend запускается на:

```txt
http://127.0.0.1:5173
```

## Запуск auth-service

```bash
cd services/auth-service
npm run start:dev
```

Auth service запускается на:

```txt
http://localhost:4001
```

Swagger документация доступна по адресу:

```txt
http://localhost:4001/docs
```

## Prisma Studio

```bash
cd services/auth-service
npx prisma studio
```

## Prisma migration

```bash
cd services/auth-service
npx prisma migrate dev --name init
```

## Сборка client frontend

```bash
cd apps/client
npm run build
```

## Сборка admin frontend

```bash
cd apps/admin
npm run build
```

## Сборка auth-service

```bash
cd services/auth-service
npm run build
```

## Линтинг

```bash
cd apps/client
npm run lint

cd ../admin
npm run lint

cd ../../services/auth-service
npm run lint
```

## Тесты auth-service

```bash
cd services/auth-service
npm run test
```

## E2E тесты auth-service

```bash
cd services/auth-service
npm run test:e2e
```

## Команды для остальных backend-сервисов

Эти команды доступны для `api-gateway`, `catalog-service`, `cart-service`, `order-service` и `ai-agent-service`.

```bash
cd services/api-gateway
npm run start:dev
npm run build
npm run test
npm run test:e2e
```

Для другого сервиса нужно заменить `api-gateway` на нужную папку сервиса.

---

# Проверка Redis

Для проверки, что Redis контейнер запущен и отвечает на команды, используется `redis-cli`.

```bash
docker exec -it market-ai-redis redis-cli ping
```

Ожидаемый ответ:

```bash
PONG
```

Если команда возвращает `PONG`, значит Redis работает корректно.

Дополнительно можно открыть Redis CLI:

```bash
docker exec -it market-ai-redis redis-cli
```

После входа в Redis CLI можно выполнить:

```bash
ping
```

Ожидаемый ответ:

```bash
PONG
```

Для выхода из Redis CLI:

```bash
exit
```

---

# Что планируется дальше

## Frontend Client

- Подключить каталог товаров к backend API
- Реализовать загрузку товаров из `catalog-service`
- Реализовать поиск товаров
- Реализовать фильтрацию и сортировку товаров
- Реализовать реальные категории товаров из базы данных
- Подключить корзину к `cart-service`
- Подключить избранное к backend
- Подключить сравнение товаров к backend
- Реализовать оформление заказа через `order-service`
- Добавить историю заказов в профиль пользователя
- Улучшить AI widget и связать его с `ai-agent-service`

## Frontend Admin

- Подключить админскую панель к backend API
- Реализовать авторизацию администратора и продавца
- Реализовать управление товарами через `catalog-service`
- Реализовать управление заказами через `order-service`
- Реализовать управление пользователями через `auth-service`
- Добавить роли и права доступа
- Добавить загрузку изображений товаров
- Добавить dashboard с реальной статистикой из backend

## Backend

- Доработать `api-gateway`
- Реализовать маршрутизацию запросов через API Gateway
- Доработать `catalog-service`
- Реализовать модели товаров, категорий и брендов
- Реализовать CRUD для товаров
- Доработать `cart-service`
- Реализовать хранение корзины пользователя
- Доработать `order-service`
- Реализовать создание и обработку заказов
- Доработать `ai-agent-service`
- Реализовать AI-рекомендации товаров
- Реализовать AI-поиск и сравнение товаров
- Добавить взаимодействие между микросервисами
- Добавить общие DTO и контракты API
- Добавить централизованную обработку ошибок
- Добавить логирование

## Infrastructure

- Добавить Dockerfile для остальных backend-сервисов
- Добавить backend-сервисы в `docker-compose.yml`
- Добавить Dockerfile для frontend-приложений
- Настроить production-сборку frontend
- Настроить Nginx / reverse proxy
- Добавить CI/CD pipeline
- Добавить GitHub Actions
- Подготовить Kubernetes / k3s deployment
- Добавить мониторинг и health checks
- Добавить централизованное логирование

## Security

- Добавить refresh token rotation
- Добавить защиту от brute-force атак
- Добавить CSRF-защиту
- Добавить более строгую настройку cookies
- Добавить RBAC для пользователей, продавцов и администраторов
- Добавить audit log для важных действий

---

```

## АНАЛИТИЧЕСКАЯ ЧАСТЬ

# 1. Общая информация о проекте

## Название проекта

MarketAI — интеллектуальный маркетплейс с AI-ассистентом.

## Описание проекта

MarketAI представляет собой интернет-магазин с элементами AI-помощника, который должен помогать пользователям искать товары, сравнивать характеристики, анализировать предложения и подбирать подходящие варианты.

Проект разрабатывается как микросервисная система с разделением на клиентский frontend, административную панель, backend-сервисы и инфраструктурный слой.

Основная идея проекта — создать учебный, но приближенный к production-архитектуре маркетплейс по типу Ozon, Wildberries или Яндекс Маркета, дополненный AI-функциями.

---

# 2. Цель проекта

Целью проекта является разработка интеллектуального маркетплейса с AI-помощником, который обеспечивает:

- просмотр товаров;
- поиск и фильтрацию товаров;
- сравнение товаров;
- добавление товаров в корзину;
- добавление товаров в избранное;
- оформление заказа;
- регистрацию и авторизацию пользователей;
- управление товарами, заказами и пользователями через административную панель;
- дальнейшую интеграцию AI-рекомендаций и AI-поиска;
- масштабируемую микросервисную backend-архитектуру.

---

# 3. Задачи проекта

Для достижения цели были определены следующие задачи:

1. Разработать клиентскую часть интернет-магазина.
2. Разработать административную панель.
3. Реализовать backend-архитектуру на основе микросервисов.
4. Реализовать сервис авторизации пользователей.
5. Подключить PostgreSQL через Prisma ORM.
6. Настроить Redis для дальнейшего использования в инфраструктуре.
7. Настроить Docker Compose для запуска инфраструктуры.
8. Реализовать регистрацию, вход, email verification и JWT-аутентификацию.
9. Реализовать UI корзины, избранного и сравнения товаров.
10. Реализовать базовый административный интерфейс.
11. Подготовить сервисы каталога, корзины, заказов и AI-агента.
12. Подготовить проект к дальнейшему расширению и контейнеризации.

---

# 4. Актуальность проекта

Современные маркетплейсы ежедневно обрабатывают большое количество товаров, заказов и пользовательских запросов. Пользователи часто сталкиваются со следующими проблемами:

- сложность выбора среди большого количества похожих товаров;
- необходимость ручного сравнения характеристик;
- перегруженные интерфейсы;
- недостаточно персонализированные рекомендации;
- большое количество времени на поиск подходящего варианта.

Использование AI-ассистента позволяет упростить процесс выбора товара и сделать взаимодействие с маркетплейсом более удобным.

Микросервисная архитектура делает проект более гибким и масштабируемым, потому что отдельные части системы можно развивать независимо друг от друга.

---

# 5. Архитектура проекта

Проект построен на микросервисной архитектуре.

Система состоит из следующих частей:

- клиентское приложение;
- административная панель;
- API Gateway;
- сервис авторизации;
- сервис каталога;
- сервис корзины;
- сервис заказов;
- AI agent service;
- инфраструктурный слой.

## Структура проекта

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
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package-lock.json
└── README.md

---

# 6. Технологический стек

## Frontend Client

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Redux Toolkit
- React Redux
- Framer Motion
- Swiper
- Lucide React
- Zod
- Prisma Client 7

## Frontend Admin

- React 19
- Vite 8
- TypeScript 6
- Tailwind CSS 4
- Redux Toolkit
- React Redux
- ESLint

## Backend

- NestJS 11
- TypeScript 5
- Prisma ORM 7
- PostgreSQL
- JWT Authentication
- Passport JWT
- Cookie Parser
- Bcrypt
- Nodemailer
- Class Validator
- Swagger/OpenAPI
- Jest
- Supertest

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16
- Redis 7

---

# 7. Реализованный функционал

## Клиентский frontend

На текущем этапе реализованы:

- главная страница маркетплейса;
- страница каталога;
- страница товара;
- корзина;
- избранное;
- сравнение товаров;
- оформление заказа;
- профиль пользователя;
- страницы входа и регистрации;
- страницы входа и регистрации продавца;
- страница пользовательского соглашения;
- header и footer;
- AI widget;
- Redux store;
- светлая и темная тема;
- интеграция с `auth-service`.

## Административная панель

Реализованы:

- dashboard;
- страница товаров;
- добавление, редактирование и удаление товаров на уровне UI state;
- страница заказов;
- изменение статусов заказов на уровне UI state;
- страница пользователей;
- изменение ролей и статусов пользователей на уровне UI state;
- страницы входа и регистрации продавца;
- страница соглашения продавца.

## Backend

Реализованы:

- `auth-service`;
- регистрация пользователя;
- подтверждение email;
- вход пользователя;
- JWT access и refresh tokens;
- хранение refresh token hash;
- обновление токенов;
- logout;
- endpoint текущего пользователя;
- JWT guard и strategy;
- Prisma schema и миграция пользователя;
- Swagger-документация;
- базовые каркасы сервисов `api-gateway`, `catalog-service`, `cart-service`, `order-service`, `ai-agent-service`.

## Infrastructure

Реализованы:

- Docker Compose;
- PostgreSQL контейнер;
- Redis контейнер;
- Docker volume для PostgreSQL;
- Docker network;
- контейнеризация `auth-service`.

---

# 8. Обоснование выбора технологий

## Next.js

Next.js выбран для клиентского frontend, потому что он поддерживает современную маршрутизацию, серверный рендеринг и хорошо подходит для интернет-магазинов.

## React

React используется для построения интерфейсов клиентского приложения и административной панели.

## TypeScript

TypeScript обеспечивает строгую типизацию и снижает количество ошибок при разработке крупного проекта.

## Tailwind CSS

Tailwind CSS позволяет быстро создавать адаптивный пользовательский интерфейс и поддерживать единый стиль компонентов.

## Redux Toolkit

Redux Toolkit используется для управления состоянием корзины, избранного, сравнения товаров и авторизации.

## NestJS

NestJS выбран для backend-сервисов благодаря модульной архитектуре, поддержке dependency injection и удобству построения микросервисных систем.

## Prisma ORM

Prisma ORM используется для работы с базой данных PostgreSQL и обеспечивает типобезопасные запросы.

## PostgreSQL

PostgreSQL выбран как надежная реляционная база данных для хранения пользователей, товаров, заказов и других сущностей.

## Redis

Redis используется как инфраструктурный компонент для кеширования, временных данных и дальнейшего взаимодействия между сервисами.

## Docker

Docker и Docker Compose используются для контейнеризации инфраструктуры и упрощения локального запуска проекта.

## Swagger/OpenAPI

Swagger используется для документирования REST API и удобной проверки backend endpoints.

---

# 9. Перспективы развития проекта

В дальнейшем планируется:

- подключить каталог товаров к backend API;
- реализовать полноценный `catalog-service`;
- реализовать полноценный `cart-service`;
- реализовать полноценный `order-service`;
- доработать `api-gateway`;
- реализовать AI-рекомендации;
- реализовать AI-поиск;
- подключить административную панель к backend;
- добавить роли пользователей, продавцов и администраторов;
- добавить загрузку изображений товаров;
- добавить оплату;
- добавить уведомления;
- добавить историю заказов;
- добавить Dockerfile для всех сервисов;
- добавить frontend-приложения в Docker;
- настроить Nginx;
- добавить CI/CD;
- подготовить Kubernetes / k3s deployment;
- добавить мониторинг и логирование.

---

# 10. Заключение

В ходе разработки проекта MarketAI была спроектирована микросервисная архитектура интеллектуального маркетплейса.

На текущем этапе реализованы клиентский frontend, административная панель, инфраструктура Docker Compose и основной сервис авторизации. Также подготовлены каркасы backend-сервисов для каталога, корзины, заказов, API Gateway и AI-агента.

Проект является учебным, но построен по принципам, приближенным к production-разработке: разделение ответственности, модульная структура, контейнеризация, использование PostgreSQL, Redis, JWT-аутентификации и Swagger-документации.

```

---

## ПРОМПТ ДЛЯ ВАШЕГО ЧАТА ИИ, ЧТОБЫ ОН ВТЯНУЛСЯ В ПРОЕКТ

```txt
Я разрабатываю проект MarketAI — интеллектуальный AI marketplace / интернет-магазин с AI-ассистентом по типу Яндекс Маркета, Ozon и Wildberries.

Проект учебный, но делается максимально приближенным к production-like архитектуре.

Основная идея:
- маркетплейс с товарами;
- клиентский frontend для покупателей;
- отдельная административная панель;
- backend на микросервисной архитектуре;
- AI-ассистент для поиска, сравнения и рекомендаций товаров;
- PostgreSQL + Redis + Docker;
- авторизация через JWT access/refresh tokens.

Текущая структура проекта:

marketplace-ai/
├── apps/
│   ├── client/                    # Клиентский frontend на Next.js
│   └── admin/                     # Админская панель на React + Vite
├── services/
│   ├── api-gateway/               # API Gateway, пока NestJS skeleton
│   ├── auth-service/              # Реализованный сервис авторизации
│   ├── catalog-service/           # Сервис каталога, пока NestJS skeleton
│   ├── cart-service/              # Сервис корзины, пока NestJS skeleton
│   ├── order-service/             # Сервис заказов, пока NestJS skeleton
│   └── ai-agent-service/          # AI agent service, пока NestJS skeleton
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package-lock.json
└── README.md

Текущий технологический стек:

Frontend Client:
- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Redux Toolkit
- React Redux
- Framer Motion
- Swiper
- Lucide React
- Zod
- Prisma Client 7

Frontend Admin:
- React 19
- Vite 8
- TypeScript 6
- Tailwind CSS 4
- Redux Toolkit
- React Redux
- ESLint

Backend:
- NestJS 11
- TypeScript 5
- Prisma ORM 7
- PostgreSQL
- JWT Authentication
- Passport JWT
- Cookie Parser
- Bcrypt
- Nodemailer
- Class Validator
- Class Transformer
- Swagger/OpenAPI
- Jest
- Supertest

Infrastructure:
- Docker
- Docker Compose
- PostgreSQL 16
- Redis 7

Что уже реализовано:

Frontend Client:
- главная страница маркетплейса;
- страница каталога;
- страница товара;
- корзина;
- избранное;
- сравнение товаров;
- оформление заказа;
- профиль пользователя;
- страницы входа и регистрации;
- страницы входа и регистрации продавца;
- страница пользовательского соглашения;
- header и footer;
- AI widget;
- Redux store;
- slices для auth, cart, favorites и compare;
- светлая и темная тема;
- интеграция с auth-service через auth-api.ts.

Frontend Admin:
- dashboard;
- страница товаров;
- добавление, редактирование и удаление товаров на уровне UI state;
- страница заказов;
- изменение статуса заказа на уровне UI state;
- страница пользователей;
- изменение роли и статуса пользователя на уровне UI state;
- модальные окна;
- dialog-компоненты;
- страницы входа и регистрации продавца;
- страница соглашения продавца.

Backend:
- реализован auth-service;
- регистрация пользователя;
- подтверждение email одноразовым кодом;
- login;
- JWT access и refresh tokens;
- хранение refresh token hash в базе;
- refresh tokens endpoint;
- logout;
- endpoint текущего пользователя /auth/me;
- JWT guard;
- JWT strategy;
- Prisma schema с моделью User;
- Prisma migration;
- PrismaService;
- PrismaModule;
- EmailModule;
- EmailService;
- Swagger/OpenAPI документация на /docs;
- rate limiting через @nestjs/throttler;
- базовые NestJS skeleton-сервисы: api-gateway, catalog-service, cart-service, order-service, ai-agent-service.

Infrastructure:
- docker-compose.yml;
- PostgreSQL контейнер;
- Redis контейнер;
- Docker volume postgres_data;
- Docker bridge network market-ai-network;
- контейнеризация auth-service.

Используемые контейнеры:
- PostgreSQL: postgres:16, container market-ai-postgres, порт 5433:5432;
- Redis: redis:7, container market-ai-redis, порт 6379:6379;
- Auth Service: container market-ai-auth, порт 4001:4001.

Важные переменные окружения:
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- DATABASE_URL
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- EMAIL_USER
- EMAIL_PASS
- CLIENT_URL
- PORT
- NEXT_PUBLIC_AUTH_API_URL
- NEXT_PUBLIC_ADMIN_URL

Важно учитывать:
- проект находится в активной разработке;
- не нужно считать skeleton-сервисы полноценными реализованными сервисами;
- полноценная backend-логика сейчас есть в auth-service;
- catalog-service, cart-service, order-service, api-gateway и ai-agent-service пока требуют доработки;
- frontend client сейчас в основном работает с локальными данными и Redux state;
- admin frontend сейчас работает с локальным UI state;
- Docker Compose сейчас поднимает PostgreSQL, Redis и auth-service;
- README нужно поддерживать в актуальном состоянии относительно реальной структуры проекта.

Ближайшие планы:
- подключить каталог товаров к backend API;
- реализовать catalog-service;
- реализовать cart-service;
- реализовать order-service;
- доработать api-gateway;
- реализовать ai-agent-service;
- подключить admin frontend к backend;
- добавить роли пользователей, продавцов и администраторов;
- добавить загрузку изображений товаров;
- добавить Dockerfile для остальных сервисов;
- добавить frontend-приложения в Docker;
- настроить Nginx;
- добавить CI/CD;
- подготовить Kubernetes / k3s deployment.

Когда отвечаешь по проекту:
- опирайся на текущую архитектуру;
- не предлагай монолит вместо микросервисов;
- сохраняй стиль production-like marketplace;
- учитывай, что frontend дизайн ориентирован на Ozon / Wildberries / Яндекс Маркет;
- backend должен оставаться на NestJS;
- база данных — PostgreSQL через Prisma;
- инфраструктура — Docker Compose с перспективой Kubernetes/k3s;
- AI-агент должен быть похож на помощника маркетплейса: поиск, сравнение, рекомендации, объяснение выбора товара.
```
