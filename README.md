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
| Catalog service | `services/catalog-service` | `4003` | Каталог товаров, управление продуктами и категориями |
| Order service | `services/order-service` | `4004` | Обработка заказов |
| Storage service | `services/storage-service` | `4005` | Хранилище (MinIO), выдача presigned URL, управление файлами |

Локальные ссылки:

```txt
Client:      http://127.0.0.1:3000
Seller:      http://127.0.0.1:5173
Moderation:  http://127.0.0.1:5174
Auth API:    http://127.0.0.1:4001
Swagger:     http://127.0.0.1:4001/docs
Cart API:    http://127.0.0.1:4002
Catalog API: http://127.0.0.1:4003
Order API:   http://127.0.0.1:4004
Storage API: http://127.0.0.1:4005
```

## Технологический стек

Frontend:
- Next.js 16, React 19, TypeScript
- Vite для кабинета продавца и панели модерации
- Redux Toolkit в клиентской витрине
- Lucide React icons
- `browser-image-compression` (сжатие изображений в WebP на клиенте)

Backend:
- NestJS
- Prisma
- PostgreSQL
- JWT auth через HttpOnly cookies
- Swagger / OpenAPI
- Nodemailer для email verification
- Class Validator / Class Transformer
- `@aws-sdk/client-s3` (интеграция с MinIO)

Infrastructure:
- Docker Compose
- PostgreSQL 16
- Redis 7
- MinIO (S3-совместимое объектное хранилище)

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
|   |-- cart-service/           # Cart API service
|   |-- catalog-service/        # Catalog API (товары, категории)
|   |-- order-service/          # Order API (заказы)
|   `-- storage-service/        # Storage API (MinIO, presigned urls)
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
- Главный дашборд (dashboard metrics) получает реальные данные о выручке и заказах из базы данных.
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

### Управление товарами и Хранилище (Catalog & Storage)

- Реализован микросервис `catalog-service` для создания, редактирования и удаления товаров.
- Подключена загрузка фотографий товаров через **MinIO** (S3-совместимое хранилище) через `storage-service`.
- Загрузка картинок происходит напрямую из браузера продавца с использованием **Presigned URLs**, минуя нагрузку на бэкенд.
- Внедрено клиентское сжатие изображений в формат **WebP** (вес фото ужимается до ~200 КБ).
- Картинки структурированно сохраняются по пути `stores/{storeName}/{sku}/`.
- Настроено автоматическое удаление неиспользуемых старых фото из MinIO.

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
NEXT_PUBLIC_CATALOG_API_URL=http://127.0.0.1:4003

PORT=4001
CART_SERVICE_PORT=4002
CATALOG_SERVICE_PORT=4003
ORDER_SERVICE_PORT=4004
STORAGE_SERVICE_PORT=4005

VITE_STORAGE_API_URL=http://127.0.0.1:4005

S3_ENDPOINT=http://127.0.0.1:9000
S3_BUCKET=market-ai-products
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
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
npm install --prefix services/catalog-service
npm install --prefix services/order-service
npm install --prefix services/storage-service
```

Поднять инфраструктуру:

```bash
docker compose up -d postgres redis minio
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

- Перенести Team and access из локального UI state в backend:
  - приглашения;
  - роли;
  - permissions;
  - email flow для invite.
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

- Доделать catalog service:
  - Текстовый поиск по названию и описанию.
  - Фильтрация (по категории, диапазону цен, продавцу).
  - Пагинация (skip/take) вместо загрузки всей базы товаров разом.
  - Сортировка (сначала дешевые, дорогие, новые, по рейтингу).
- Доделать cart service:
  - Валидация цен и остатков перед оформлением (проверка через catalog-service).
  - Логика резервирования товаров.
- Доделать order service:
  - Сплитование (разделение) заказа клиента на суб-заказы для разных продавцов.
  - Списание остатков в каталоге при оформлении.
  - Полноценная статусная модель (Создан -> Оплачен -> В сборке -> В доставке -> Доставлен).
- Добавить доставку.
- Добавить уведомления.
- Добавить историю заказов:
  - Для покупателя: личный кабинет с историей покупок, статусами и чеками.
  - Для продавца: интерфейс обработки саб-заказов (перевод статусов, печать этикеток).
- Добавить seller analytics (Аналитика продавца):
  - Графики продаж (выручка по дням/месяцам).
  - Аналитика конверсии (воронка продаж) и топы продаж.
  - Аналитика рейтингов и отзывов.
- Настроить полноценный CI/CD пайплайн (GitHub Actions / GitLab CI):
  - CI: автоматический прогон линтеров, проверки типов и тестов при пуше.
  - Сборка: автоматическая генерация Docker-образов и отправка их в реестр.
  - CD: автоматический деплой (обновление контейнеров) на боевом сервере.

### Долгосрочные задачи

- **Умные функции (AI):**
  - AI-поиск товаров (векторный/семантический поиск по смыслу запроса, а не только по точным совпадениям).
  - AI-рекомендации (персонализированные блоки "С этим часто покупают" на основе истории пользователя).
  - AI-ассистент (LLM-чат-бот, который человеческим языком объяснит разницу между похожими товарами).
- **Инфраструктура и DevOps:**
  - Production Dockerfile для Frontend-приложений (сборка оптимизированной статики для client, admin, moderation).
  - Nginx reverse proxy (единый вход для трафика, настройка SSL/HTTPS шифрования).
  - Kubernetes / k3s deployment (кластеризация, 100% отказоустойчивость и авто-масштабирование при высоких нагрузках).
  - Monitoring и logging:
    - **Prometheus + Grafana:** дашборды с графиками здоровья системы и алертами.
    - **ELK Stack:** централизованный сбор логов со всех микросервисов для удобного поиска багов.

