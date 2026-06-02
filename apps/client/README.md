# MarketAI Client

Клиентская витрина маркетплейса MarketAI на Next.js. Приложение отвечает за публичный каталог, карточки товаров, корзину, избранное, сравнение, оформление заказа, профиль покупателя и клиентскую авторизацию.

## Стек

- Next.js 16 + React 19
- TypeScript
- Redux Toolkit + React Redux
- Tailwind CSS 4
- Prisma Client
- i18next / react-i18next
- Lucide React, Framer Motion, Swiper

## Быстрый старт

Установить зависимости:

```bash
npm install
```

Запустить клиентское приложение:

```bash
npm run dev
```

По умолчанию dev-сервер стартует на:

```txt
http://127.0.0.1:3000
```

Если нужно запустить клиент из корня монорепозитория:

```bash
npm run dev:client
```

## Переменные окружения

Создайте или обновите файл `.env.local` в `apps/client`:

```env
NEXT_PUBLIC_AUTH_API_URL=http://127.0.0.1:4001
NEXT_PUBLIC_SHOPPING_API_URL=http://127.0.0.1:4002
```

Назначение переменных:

| Переменная | Описание |
| --- | --- |
| `NEXT_PUBLIC_AUTH_API_URL` | URL auth-service: регистрация, вход, выход, текущий пользователь, восстановление пароля |
| `NEXT_PUBLIC_SHOPPING_API_URL` | URL cart-service/shopping API: корзина, избранное, сравнение |

Если `NEXT_PUBLIC_SHOPPING_API_URL` не задан, клиент попробует вычислить его из `NEXT_PUBLIC_AUTH_API_URL`, заменив порт `4001` на `4002`.

## Команды

```bash
npm run dev
```

Запуск локального Next.js dev-сервера.

```bash
npm run build
```

Production-сборка приложения.

```bash
npm run start
```

Запуск production-сборки. Перед этим нужно выполнить `npm run build`.

```bash
npm run lint
```

Проверка ESLint.

## Основные маршруты

| Маршрут | Назначение |
| --- | --- |
| `/` | Главная страница с hero-блоком, секцией товаров и AI-виджетом |
| `/catalog` | Каталог товаров |
| `/products/[id]` | Страница товара |
| `/cart` | Корзина |
| `/checkout` | Оформление заказа |
| `/favorites` | Избранное |
| `/compare` | Сравнение товаров |
| `/profile` | Профиль покупателя |
| `/login` | Вход покупателя |
| `/register` | Регистрация покупателя |
| `/seller/login` | Вход продавца |
| `/seller/register` | Регистрация продавца |
| `/agreement` | Пользовательское соглашение |

## Структура

```txt
apps/client/
|-- app/                       # App Router страницы Next.js
|   |-- catalog/
|   |-- cart/
|   |-- checkout/
|   |-- compare/
|   |-- favorites/
|   |-- login/
|   |-- products/[id]/
|   |-- profile/
|   |-- register/
|   `-- seller/
|
|-- src/
|   |-- components/            # UI и page-компоненты
|   |   |-- auth/
|   |   |-- cart/
|   |   |-- catalog/
|   |   |-- checkout/
|   |   |-- compare/
|   |   |-- favorites/
|   |   |-- home/
|   |   |-- layout/
|   |   |-- product/
|   |   |-- profile/
|   |   `-- ui/
|   |
|   |-- data/                  # Локальные данные товаров и категорий
|   |-- hooks/                 # Клиентские хуки
|   |-- lib/                   # API-клиенты и утилиты
|   `-- store/                 # Redux store, slices и hydration
|
|-- public/
|-- package.json
|-- next.config.ts
|-- tsconfig.json
`-- README.md
```

## API-интеграции

Auth API используется в `src/lib/auth-api.ts`:

- `POST /auth/register`
- `POST /auth/verify-email`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Shopping API используется в `src/lib/shopping-api.ts`:

- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:productId`
- `DELETE /cart/items/:productId`
- `DELETE /cart`
- `GET /favorites`
- `POST /favorites/:productId`
- `DELETE /favorites/:productId`
- `GET /compare`
- `POST /compare/:productId`
- `DELETE /compare/:productId`

Запросы отправляются с `credentials: "include"`, поэтому backend должен корректно отдавать CORS и cookie-настройки для локального клиента.

## Состояние приложения

Redux store находится в `src/store`:

- `authSlice.ts` - пользовательская сессия
- `cartSlice.ts` - корзина
- `favoritesSlice.ts` - избранное
- `compareSlice.ts` - сравнение
- `shoppingHydration.ts` - синхронизация shopping state с backend
- `provider.tsx` - подключение store к React-дереву

## Локальная разработка

Для полноценной работы клиенту нужны backend-сервисы:

```txt
Auth API:     http://127.0.0.1:4001
Shopping API: http://127.0.0.1:4002
Client:       http://127.0.0.1:3000
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

Если сборка падает из-за недоступного backend, сначала проверьте `.env.local` и запущенные сервисы `auth-service` и `cart-service`.
