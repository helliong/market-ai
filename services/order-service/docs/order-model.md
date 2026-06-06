# Order storage model

Backend and PostgreSQL must be the single source of truth for orders. The client may cache the response for UX, but order history and order details must always be read from `order-service`.

## Tables

### `orders`

The aggregate root. It stores the buyer, denormalized purchase snapshot, independent status dimensions, totals and important lifecycle dates.

Important fields:

- `id`: internal UUID.
- `public_id`: human-facing order number, unique and stable.
- `buyer_id`: account id from auth context.
- `status`: aggregate order status, used for high-level UI.
- `payment_status`: payment state.
- `fulfillment_status`: delivery/execution state.
- `delivery_method`, `payment_method`, `currency`.
- `items_total`, `delivery_total`, `discount_total`, `grand_total`.
- `customer_name`, `customer_phone`, `customer_email`: customer snapshot.
- `delivery_city`, `delivery_street`, `delivery_house`, `delivery_flat`, `delivery_comment`: delivery snapshot.
- `created_at`, `updated_at`, `paid_at`, `cancelled_at`, `completed_at`.

### `order_items`

Line items with product and seller identifiers plus product snapshot at the moment of checkout.

Important fields:

- `product_id`, `seller_id`.
- `product_title_snapshot`, `product_price_snapshot`.
- `quantity`, `line_total`.

Current product title and price must not be used to render historical orders.

### `order_payments`

Payment attempts for the order. Keeping it separate allows retries, refunds and provider webhooks without overwriting the order itself.

Important fields:

- `provider`: currently `yookassa`.
- `provider_payment_id`: YooKassa payment id.
- `status`: provider-normalized payment status.
- `amount`.
- `raw_payload`: raw provider response/webhook payload for audit/debug.

### `order_status_history`

Append-only status audit log. `kind` tells whether the change belongs to aggregate order status, payment status, or fulfillment status.

Important fields:

- `kind`: `order`, `payment`, `fulfillment`.
- `from_status`, `to_status`.
- `source`: `system`, `buyer`, `seller`, `admin`, `payment_provider`.
- `comment`, `created_at`.

## Statuses

Payment statuses:

- `pending`
- `paid`
- `canceled`
- `failed`
- `refunded`

Fulfillment statuses:

- `new`
- `confirmed`
- `processing`
- `shipped`
- `ready_for_pickup`
- `delivered`
- `received`
- `canceled`

Aggregate order statuses:

- `awaiting_payment`
- `paid`
- `processing`
- `shipping`
- `ready`
- `completed`
- `cancelled`

## Checkout lifecycle

1. `POST /orders/checkout` validates auth, cart/items, customer and delivery.
2. The service resolves every `product_id` through catalog-service and uses catalog `sellerId`, `name` and `price` as the trusted order item snapshot.
3. In one DB transaction, the service creates `orders` with:
   - `status = awaiting_payment`
   - `payment_status = pending`
   - `fulfillment_status = new`
4. The same transaction creates `order_items` from trusted catalog snapshots.
5. The same transaction writes initial `order_status_history` rows.
6. The service creates a YooKassa payment with `metadata.order_id = orders.id`.
7. The service updates/creates `order_payments` with `provider_payment_id`, `status = pending`, amount and raw provider response.
8. The client redirects to YooKassa `confirmation_url`.
9. YooKassa calls `POST /payments/yookassa/webhook`.
10. Webhook handler finds `order_payments` by `provider + provider_payment_id` or `orders.id` from metadata.
11. On `payment.succeeded`, the service changes:
    - `order_payments.status: pending -> paid`
    - `orders.payment_status: pending -> paid`
    - `orders.status: awaiting_payment -> paid` or `processing`
    - `orders.fulfillment_status: new -> confirmed` or `processing`
    - `orders.paid_at = now()`
12. Every status change is appended to `order_status_history`.
13. Order history UI calls backend instead of rebuilding history from `localStorage`.

## Suggested API

- `POST /orders/checkout`
  - Creates order, order items and payment, returns `{ orderId, publicId, paymentId, status, paymentStatus, confirmationUrl }`.
- `GET /orders`
  - Returns paginated buyer order history for the current BUYER `accessToken` cookie. `buyerId` must come from JWT `sub`, not from query params.
- `GET /orders/:id`
  - Returns one current-buyer order with items, payments and optionally status history.
- `POST /orders/:id/cancel`
  - Cancels one current-buyer order, moves it to aggregate `cancelled`, fulfillment `canceled`, logs status history and returns the updated order.
- `GET /orders/:id/status-history`
  - Returns audit trail if the profile/admin UI needs it separately.
- `POST /payments/yookassa/webhook`
  - Accepts provider webhook, idempotently updates payment/order statuses and logs transitions.

## Implementation notes

- Generate `public_id` server-side, for example `MA-YYYYMMDD-000001` using a DB-backed sequence or a short sortable id with a unique constraint.
- Treat YooKassa webhooks as idempotent: repeated `payment.succeeded` should not create duplicate transitions.
- Never trust client-supplied prices, titles or seller ids for final totals and snapshots. The service resolves current products from catalog at checkout, then saves snapshots.
- Keep `raw_payload` for payment audit, but do not expose it to buyer-facing API.
- Consider reserving stock in catalog/cart flow before redirecting to payment, then committing reservation after successful payment.
