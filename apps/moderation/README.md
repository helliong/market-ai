# MarketAI Moderation

Модераторская часть MarketAI для ручной проверки продавцов. Приложение показывает заявки магазинов со статусом `UNDER_REVIEW`, отображает юридические данные продавца и позволяет одобрить или отклонить заявку с комментарием.

## Стек

- React 19
- TypeScript
- Vite
- Lucide React

## Быстрый старт

Установить зависимости:

```bash
npm install
```

Запустить moderation app:

```bash
npm run dev
```

Dev-сервер запускается строго на:

```txt
http://127.0.0.1:5174
```

Если нужно запустить приложение из корня монорепозитория:

```bash
npm run dev:moderation
```

## Переменные окружения

Создайте файл `.env.local` в `apps/moderation`, если нужно переопределить URL backend:

```env
VITE_AUTH_API_URL=http://127.0.0.1:4001
```

Назначение переменной:

| Переменная | Описание |
| --- | --- |
| `VITE_AUTH_API_URL` | URL auth-service с moderation endpoints |

Если переменная не задана, приложение использует `http://127.0.0.1:4001`.

Ключ модератора берется из backend env:

```env
MODERATION_ADMIN_KEY=modkey123
```

В UI этот ключ вводится вручную в поле `Ключ модератора`. Приложение сохраняет его в `localStorage` под ключом `marketai-moderation-key` и отправляет в header `x-admin-key`.

## Команды

```bash
npm run dev
```

Запуск локального Vite dev-сервера на `127.0.0.1:5174`.

```bash
npm run build
```

TypeScript-проверка через `tsc -b` и production-сборка через Vite.

```bash
npm run preview
```

Preview production-сборки.

В текущем `package.json` нет отдельной команды `lint`.

## Основной экран

Приложение состоит из одного рабочего экрана:

- ввод ключа модератора;
- загрузка продавцов на проверке;
- счетчик заявок `UNDER_REVIEW`;
- карточки продавцов;
- просмотр Legal data;
- approve заявки;
- reject заявки с обязательным комментарием;
- toast notifications для успешных действий и ошибок.

## Структура

```txt
apps/moderation/
|-- src/
|   |-- App.tsx                 # UI модерации, загрузка заявок, approve/reject flow
|   |-- App.css                 # Стили основного экрана
|   |-- auth-api.ts             # API-клиент moderation endpoints
|   |-- index.css
|   `-- main.tsx
|
|-- index.html
|-- package.json
|-- vite.config.ts
|-- tsconfig.json
`-- README.md
```

## API-интеграции

Moderation API используется в `src/auth-api.ts`:

- `GET /auth/admin/sellers/review`
- `POST /auth/admin/sellers/:sellerId/approve`
- `POST /auth/admin/sellers/:sellerId/reject`

Каждый запрос отправляется с:

```txt
x-admin-key: <MODERATION_ADMIN_KEY>
```

Reject-запрос отправляет комментарий модератора:

```json
{
  "comment": "Что продавцу нужно исправить"
}
```

## Seller moderation flow

Ожидаемый сценарий:

1. Продавец регистрируется в seller admin.
2. Продавец заполняет legal data в `/settings`.
3. Продавец отправляет данные на проверку.
4. Seller status становится `UNDER_REVIEW`.
5. Модератор открывает `http://127.0.0.1:5174`.
6. Модератор вводит `MODERATION_ADMIN_KEY`.
7. Модератор нажимает `Показать заявки` или `Обновить`.
8. Модератор проверяет legal data.
9. Модератор нажимает `Одобрить` или `Отклонить`.
10. При отклонении модератор указывает комментарий для продавца.

После approve продавец получает статус `ACTIVATED`. После reject продавец получает статус `REJECTED` и может исправить данные в seller admin.

## Локальная разработка

Для полноценной работы нужен auth-service:

```txt
Moderation: http://127.0.0.1:5174
Auth API:   http://127.0.0.1:4001
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
npm run build
```

Также вручную проверьте, что `MODERATION_ADMIN_KEY` совпадает с backend env и что auth-service запущен на URL из `VITE_AUTH_API_URL`.
