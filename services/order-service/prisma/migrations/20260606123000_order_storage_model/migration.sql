-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('awaiting_payment', 'paid', 'processing', 'shipping', 'ready', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "order_payment_status" AS ENUM ('pending', 'paid', 'canceled', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "order_fulfillment_status" AS ENUM ('new', 'confirmed', 'processing', 'shipped', 'ready_for_pickup', 'delivered', 'received', 'canceled');

-- CreateEnum
CREATE TYPE "order_payment_provider" AS ENUM ('yookassa');

-- CreateEnum
CREATE TYPE "order_status_history_kind" AS ENUM ('order', 'payment', 'fulfillment');

-- CreateEnum
CREATE TYPE "order_status_history_source" AS ENUM ('system', 'buyer', 'seller', 'admin', 'payment_provider');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'awaiting_payment',
    "payment_status" "order_payment_status" NOT NULL DEFAULT 'pending',
    "fulfillment_status" "order_fulfillment_status" NOT NULL DEFAULT 'new',
    "delivery_method" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'RUB',
    "items_total" DECIMAL(12,2) NOT NULL,
    "delivery_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "delivery_city" TEXT NOT NULL,
    "delivery_street" TEXT NOT NULL,
    "delivery_house" TEXT NOT NULL,
    "delivery_flat" TEXT,
    "delivery_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" INTEGER NOT NULL,
    "seller_id" TEXT NOT NULL,
    "product_title_snapshot" TEXT NOT NULL,
    "product_price_snapshot" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" "order_payment_provider" NOT NULL,
    "provider_payment_id" TEXT,
    "status" "order_payment_status" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(12,2) NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "kind" "order_status_history_kind" NOT NULL DEFAULT 'order',
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "source" "order_status_history_source" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_public_id_key" ON "orders"("public_id");

-- CreateIndex
CREATE INDEX "orders_buyer_id_created_at_idx" ON "orders"("buyer_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_payment_status_idx" ON "orders"("payment_status");

-- CreateIndex
CREATE INDEX "orders_fulfillment_status_idx" ON "orders"("fulfillment_status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "order_items_seller_id_idx" ON "order_items"("seller_id");

-- CreateIndex
CREATE INDEX "order_payments_order_id_idx" ON "order_payments"("order_id");

-- CreateIndex
CREATE INDEX "order_payments_status_idx" ON "order_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "order_payments_provider_provider_payment_id_key" ON "order_payments"("provider", "provider_payment_id");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_status_history_kind_idx" ON "order_status_history"("kind");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
