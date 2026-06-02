# MarketAI Seller Admin

Админская часть MarketAI для продавцов. Приложение отвечает за регистрацию и вход продавца, welcome-экран, пользовательское соглашение, кабинет магазина, товары, заказы, пользователей команды, настройки магазина и отправку юридических данных на модерацию.

## Стек

- React 19
- TypeScript
- Vite
- Redux Toolkit + React Redux
- Tailwind CSS 4
- Lucide React
- ESLint

## Быстрый старт

Установить зависимости:

```bash
npm install
```

Запустить seller admin:

```bash
npm run dev
```

Dev-сервер запускается строго на:

```txt
http://127.0.0.1:5173
```

Если нужно запустить приложение из корня монорепозитория:

```bash
npm run dev:admin
```

## Переменные окружения

Создайте файл `.env.local` в `apps/admin`, если нужно переопределить URL backend:

```env
VITE_AUTH_API_URL=http://127.0.0.1:4001
```

Назначение переменной:

| Переменная | Описание |
| --- | --- |
| `VITE_AUTH_API_URL` | URL auth-service для seller auth, профиля продавца и legal moderation flow |

Если переменная не задана, приложение использует `http://127.0.0.1:4001`.

## Команды

```bash
npm run dev
```

Запуск локального Vite dev-сервера на `127.0.0.1:5173`.

```bash
npm run build
```

TypeScript-проверка через `tsc -b` и production-сборка через Vite.

```bash
npm run lint
```

Проверка ESLint.

```bash
npm run preview
```

Preview production-сборки.

## Основные маршруты

Приложение использует client-side routing через `window.history`.

| Маршрут | Назначение |
| --- | --- |
| `/` | Welcome-экран для продавцов |
| `/register` | Регистрация продавца |
| `/login` | Вход продавца |
| `/agreement` | Пользовательское соглашение продавца |
| `/terms` | Альтернативный путь к соглашению |
| `/dashboard` | Дашборд магазина |
| `/products` | Управление товарами |
| `/orders` | Заказы |
| `/users` | Пользователи и роли команды |
| `/settings` | Настройки магазина, legal data, команда, danger zone |

## Структура

```txt
apps/admin/
|-- src/
|   |-- admin/
|   |   |-- components/          # Диалоги, карточки статистики, modal товара, badges
|   |   |-- pages/               # Dashboard, Products, Orders, Users, Settings
|   |   |-- data.ts              # Начальные формы и локальные данные
|   |   |-- formatters.ts
|   |   `-- types.ts
|   |
|   |-- agreement/               # Seller agreement page
|   |-- hooks/                   # Локализация
|   |-- login/                   # Seller login
|   |-- register/                # Seller registration
|   |-- welcome/                 # Seller welcome page
|   |
|   |-- App.tsx                  # Роутинг, layout, seller session, local state
|   |-- auth-api.ts              # API-клиент auth-service
|   |-- settings-store.ts        # Theme/language localStorage store
|   |-- ThemeProvider.tsx
|   `-- main.tsx
|
|-- public/
|-- index.html
|-- package.json
|-- vite.config.ts
|-- tsconfig.json
`-- README.md
```

## API-интеграции

Seller auth API используется в `src/auth-api.ts`:

- `POST /auth/seller/register`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/seller/login`
- `POST /auth/seller/refresh`
- `GET /auth/seller/me`
- `POST /auth/seller/logout`
- `POST /auth/seller/forgot-password`
- `POST /auth/seller/reset-password`

Legal profile API:

- `PUT /auth/seller/legal-profile`
- `POST /auth/seller/legal-profile/submit`

Запросы отправляются с `credentials: "include"`. Для seller endpoints при `401` приложение пытается обновить сессию через `/auth/seller/refresh` и повторить запрос.

## Seller moderation flow

Статусы продавца:

| Статус | Значение |
| --- | --- |
| `PENDING_LEGAL_DATA` | Продавец зарегистрирован, но еще не отправил legal data |
| `UNDER_REVIEW` | Legal data отправлены и ждут проверки |
| `ACTIVATED` | Магазин одобрен, продавец может добавлять товары |
| `REJECTED` | Заявка отклонена, продавец видит комментарий модератора |
| `SUSPENDED` | Магазин заблокирован |

Страница `/products` разрешает добавлять товары только при статусе `ACTIVATED`. При других статусах показывается причина, а создание товара блокируется на UI-уровне.

## Состояние приложения

Основное состояние хранится в `App.tsx`:

- текущая страница;
- список товаров;
- список заказов;
- список пользователей;
- текущий seller profile;
- состояние модальных окон и диалогов;
- форма товара;
- имя магазина.

Тема и язык сохраняются в `localStorage` через `src/settings-store.ts`:

- `marketai-theme`
- `marketai-language`

## Локальная разработка

Для полноценной работы нужен auth-service:

```txt
Seller Admin: http://127.0.0.1:5173
Auth API:     http://127.0.0.1:4001
```

Из корня репозитория можно запустить все dev-приложения и сервисы:

```bash
npm run start:dev
```

Или только backend:

```bash
npm run start:dev:backend
```

## Проверка перед изменениями

Перед отправкой изменений полезно выполнить:

```bash
npm run lint
npm run build
```
