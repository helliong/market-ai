# MarketAI

MarketAI - маркетплейс с клиентской витриной, кабинетом продавца, отдельной панелью модерации и backend-сервисами.

Проект находится в активной разработке. Часть функциональности уже подключена к backend API, но продукты, заказы, команда и часть настроек магазина пока работают на локальном UI state и требуют дальнейшего подключения к backend.

## Текущие приложения и сервисы

| Приложение / сервис | Путь | Порт | Описание |
| --- | --- | --- | --- |
| Клиентская витрина | `apps/client` | `3000` | Публичный marketplace frontend на Next.js |
| Кабинет продавца | `apps/admin` | `5173` | Seller admin на React + Vite |
| Панель модерации | `apps/moderation` | `5174` | Отдельная панель ручной модерации |
| Auth service | `services/auth-service` | `4001` | Авторизация, регистрация продавца, Legal data, moderation API |
| Cart service | `services/cart-service` | `4002` | Сервис корзины / ранняя реализация |

Локальные ссылки:

```txt
Client:      http://127.0.0.1:3000
Seller:      http://127.0.0.1:5173
Moderation:  http://127.0.0.1:5174
Auth API:    http://127.0.0.1:4001
Swagger:     http://127.0.0.1:4001/docs
Cart API:    http://127.0.0.1:4002
```

## Технологический стек

Frontend:
- Next.js 16, React 19, TypeScript
- Vite для кабинета продавца и панели модерации
- Redux Toolkit в клиентской витрине
- Lucide React icons

Backend:
- NestJS
- Prisma
- PostgreSQL
- JWT auth через HttpOnly cookies
- Swagger / OpenAPI
- Nodemailer для email verification
- Class Validator / Class Transformer

Infrastructure:
- Docker Compose
- PostgreSQL 16
- Redis 7

## Структура проекта

```txt
marketplace-ai/
|-- apps/
|   |-- client/                 # Клиентская витрина, Next.js
|   |-- admin/                  # Кабинет продавца, React + Vite
|   `-- moderation/             # Панель ручной модерации, React + Vite
|
|-- services/
|   |-- auth-service/           # Auth, seller legal flow, moderation API
|   |   |-- prisma/
|   |   |   |-- schema.prisma
|   |   |   `-- migrations/
|   |   `-- src/
|   |       |-- auth/
|   |       |   |-- dto/
|   |       |   |-- guards/
|   |       |   `-- strategies/
|   |       |-- email/
|   |       `-- prisma/
|   |
|   `-- cart-service/           # Cart API service
|
|-- scripts/
|   `-- print-dev-links.cjs     # Печатает локальные dev-ссылки
|
|-- docker-compose.yml
|-- .env.example
|-- package.json
`-- README.md
```

## Что уже сделано

### Кабинет продавца

- Регистрация и вход продавца.
- Страница пользовательского соглашения продавца.
- Поддержка языка и темы в seller-facing экранах.
- Страница `Settings`, где есть:
  - обложка магазина с локальным preview;
  - название, описание, город, телефон, email;
  - юридические данные;
  - команда и доступы;
  - danger zone.
- Название магазина и email владельца подтягиваются из данных регистрации / профиля.
- Добавлены маски:
  - телефон;
  - ИНН / БИН;
  - банковский счёт / IBAN.
- Добавлены toast notifications:
  - зелёные для успешных действий;
  - красные для ошибок и отказов модерации.
- В блоке Team owner теперь реальный создатель магазина с его почтой.
- До активации магазина продавец может ходить по dashboard/products/etc, но не может добавлять товары.

### Seller Legal Moderation Flow

Статусы магазина:

| Статус | Значение |
| --- | --- |
| `PENDING_LEGAL_DATA` | Продавец зарегистрировался, но ещё не отправил Legal data |
| `UNDER_REVIEW` | Legal data отправлены и ждут проверки |
| `ACTIVATED` | Магазин одобрен и может добавлять товары |
| `REJECTED` | Заявка отклонена, продавец может исправить данные и отправить повторно |
| `SUSPENDED` | Магазин заблокирован |

Основной сценарий:

1. Продавец регистрируется.
2. Продавца перебрасывает в кабинет продавца.
3. Магазин получает статус `PENDING_LEGAL_DATA`.
4. Продавец заполняет Legal data в Settings.
5. Продавец отправляет Legal data на проверку.
6. Статус меняется на `UNDER_REVIEW`.
7. Модератор одобряет или отклоняет заявку.
8. Если заявка одобрена, статус становится `ACTIVATED`.
9. Если заявка отклонена, статус становится `REJECTED`, продавец видит комментарий модератора.
10. Продавец может исправить данные и отправить их повторно.

### Панель модерации

Добавлено отдельное приложение:

```txt
apps/moderation
```

Оно запускается отдельно от кабинета продавца на порту `5174`.

Возможности модерации:
- ввод `MODERATION_ADMIN_KEY`;
- загрузка продавцов, ожидающих проверки;
- просмотр Legal data продавца;
- approve продавца;
- reject продавца с комментарием;
- toast notifications для успешных и ошибочных действий.

### Клиентская часть

- Реализована клиентская витрина маркетплейса на Next.js.
- Настроен общий layout приложения.
- Реализованы header и footer.
- Реализована главная страница маркетплейса.
- Добавлен hero-блок и основные секции товаров.
- Реализованы карточки товаров.
- Реализована страница каталога.
- Реализована страница товара.
- Реализована корзина.
- Реализовано избранное.
- Реализовано сравнение товаров.
- Реализована страница оформления заказа.
- Реализована страница профиля пользователя.
- Реализованы страницы входа и регистрации покупателя.
- Реализована страница пользовательского соглашения.
- Добавлен AI widget на клиентской части.
- Настроен Redux store.
- Добавлены Redux slices для auth, cart, favorites и compare.
- Добавлена интеграция с `auth-service` через `auth-api`.
- Поддерживается светлая и тёмная тема.
- Часть пользовательских данных и действий пока работает через локальный state / Redux и требует дальнейшего подключения к backend.

### Auth Service

Добавлена backend-поддержка для:
- owner email / owner name у продавца;
- legal profile продавца;
- endpoint отправки Legal data на проверку;
- moderation endpoints;
- guard для модерации через `x-admin-key`;
- повторной отправки после `REJECTED`;
- нормализации значений с масками перед сохранением;
- Swagger-документации для Legal data и moderation endpoints.

Основные endpoints:

```txt
GET  /auth/seller/me
PUT  /auth/seller/legal-profile
POST /auth/seller/legal-profile/submit

GET  /auth/admin/sellers/review
POST /auth/admin/sellers/:sellerId/approve
POST /auth/admin/sellers/:sellerId/reject
```

Moderation endpoints требуют header:

```txt
x-admin-key: <MODERATION_ADMIN_KEY>
```

## Переменные окружения

За основу брать `.env.example`.

Важные переменные:

```env
POSTGRES_USER=marketai
POSTGRES_PASSWORD=change_me_password
POSTGRES_DB=market_ai_db

DATABASE_URL=postgresql://marketai:change_me_password@localhost:5433/market_ai_db?schema=public

JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

MODERATION_ADMIN_KEY=modkey123

CLIENT_URL=http://127.0.0.1:3000
ADMIN_CLIENT_URL=http://127.0.0.1:5173
MODERATION_CLIENT_URL=http://127.0.0.1:5174

NEXT_PUBLIC_AUTH_API_URL=http://127.0.0.1:4001
NEXT_PUBLIC_SHOPPING_API_URL=http://127.0.0.1:4002

PORT=4001
CART_SERVICE_PORT=4002
```

## Установка и запуск

Установить root dependencies:

```bash
npm install
```

При необходимости установить зависимости отдельных приложений / сервисов:

```bash
npm install --prefix apps/client
npm install --prefix apps/admin
npm install --prefix apps/moderation
npm install --prefix services/auth-service
npm install --prefix services/cart-service
```

Поднять инфраструктуру:

```bash
docker compose up -d postgres redis
```

Применить Prisma migrations:

```bash
npx prisma migrate dev --schema services/auth-service/prisma/schema.prisma
npx prisma generate --schema services/auth-service/prisma/schema.prisma
```

Запустить все dev-приложения:

```bash
npm run start:dev
```

Запуск по отдельности:

```bash
npm run dev:client
npm run dev:admin
npm run dev:moderation
npm run dev:auth
npm run dev:cart
```

## Как пользоваться модерацией

1. Открыть `http://127.0.0.1:5174`.
2. Ввести ключ из env: `MODERATION_ADMIN_KEY`.
3. Нажать `Показать заявки`.
4. Проверить Legal data продавца.
5. Нажать `Одобрить` или `Отклонить`.
6. При отклонении добавить комментарий, что продавцу нужно исправить.

## Проверка сборки

Полезные команды:

```bash
npm run build --prefix apps/admin
npm run build --prefix apps/moderation
npm run build --prefix services/auth-service
```

## Что осталось сделать

### Ближайшие задачи

- Сохранять store settings на backend:
  - обложка;
  - описание;
  - город;
  - телефон;
  - публичная почта.
- Добавить реальную загрузку обложки магазина вместо локального preview.
- Перенести Team and access из локального UI state в backend:
  - приглашения;
  - роли;
  - permissions;
  - email flow для invite.
- Подключить создание, редактирование и удаление товаров к backend.
- Добавить backend-правило: продавец не может создать товар, если магазин не `ACTIVATED`.
- Добавить историю модерации / audit log.
- Улучшить auth для модерации:
  - заменить статический `MODERATION_ADMIN_KEY` на реальные admin accounts;
  - добавить admin roles и sessions.
- Добавить тесты для:
  - submit Legal data;
  - approve / reject flow;
  - повторной отправки после reject;
  - блокировки создания товара до `ACTIVATED`.

### Среднесрочные задачи

- Доделать catalog service.
- Доделать cart service.
- Доделать order service.
- Добавить оплату.
- Добавить доставку.
- Добавить уведомления.
- Добавить загрузку изображений товаров.
- Добавить историю заказов.
- Добавить seller analytics.
- Добавить реальные dashboard metrics.
- Добавить API gateway.
- Добавить CI/CD.

### Долгосрочные задачи

- Добавить AI-поиск товаров.
- Добавить AI-рекомендации.
- Добавить AI-ассистента для сравнения товаров.
- Добавить production Dockerfile для всех apps/services.
- Добавить Nginx reverse proxy.
- Подготовить Kubernetes / k3s deployment.
- Добавить monitoring и logging.

