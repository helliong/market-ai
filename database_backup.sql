--
-- PostgreSQL database dump
--

\restrict FJtHemUBejYbZZMn9zn1itO8ytivZMgeThnrqRfJuLpXzK57pQN8sz3YmXpFLap

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: marketai
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO marketai;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: marketai
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CredentialScope; Type: TYPE; Schema: public; Owner: marketai
--

CREATE TYPE public."CredentialScope" AS ENUM (
    'BUYER',
    'SELLER'
);


ALTER TYPE public."CredentialScope" OWNER TO marketai;

--
-- Name: SellerStatus; Type: TYPE; Schema: public; Owner: marketai
--

CREATE TYPE public."SellerStatus" AS ENUM (
    'PENDING_LEGAL_DATA',
    'UNDER_REVIEW',
    'ACTIVATED',
    'SUSPENDED',
    'REJECTED',
    'PAUSED'
);


ALTER TYPE public."SellerStatus" OWNER TO marketai;

--
-- Name: order_fulfillment_status; Type: TYPE; Schema: public; Owner: marketai
--

CREATE TYPE public.order_fulfillment_status AS ENUM (
    'new',
    'confirmed',
    'processing',
    'shipped',
    'ready_for_pickup',
    'delivered',
    'received',
    'canceled'
);


ALTER TYPE public.order_fulfillment_status OWNER TO marketai;

--
-- Name: order_payment_provider; Type: TYPE; Schema: public; Owner: marketai
--

CREATE TYPE public.order_payment_provider AS ENUM (
    'yookassa'
);


ALTER TYPE public.order_payment_provider OWNER TO marketai;

--
-- Name: order_payment_status; Type: TYPE; Schema: public; Owner: marketai
--

CREATE TYPE public.order_payment_status AS ENUM (
    'pending',
    'paid',
    'canceled',
    'failed',
    'refunded'
);


ALTER TYPE public.order_payment_status OWNER TO marketai;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: marketai
--

CREATE TYPE public.order_status AS ENUM (
    'awaiting_payment',
    'paid',
    'processing',
    'shipping',
    'ready',
    'completed',
    'cancelled'
);


ALTER TYPE public.order_status OWNER TO marketai;

--
-- Name: order_status_history_kind; Type: TYPE; Schema: public; Owner: marketai
--

CREATE TYPE public.order_status_history_kind AS ENUM (
    'order',
    'payment',
    'fulfillment'
);


ALTER TYPE public.order_status_history_kind OWNER TO marketai;

--
-- Name: order_status_history_source; Type: TYPE; Schema: public; Owner: marketai
--

CREATE TYPE public.order_status_history_source AS ENUM (
    'system',
    'buyer',
    'seller',
    'admin',
    'payment_provider'
);


ALTER TYPE public.order_status_history_source OWNER TO marketai;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    email text NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "verificationCode" text,
    "verificationCodeExpires" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Account" OWNER TO marketai;

--
-- Name: AccountCredential; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."AccountCredential" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    scope public."CredentialScope" NOT NULL,
    "passwordHash" text NOT NULL,
    "refreshTokenHash" text,
    "resetCode" text,
    "resetCodeExpires" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AccountCredential" OWNER TO marketai;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "productId" integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO marketai;

--
-- Name: CompareItem; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."CompareItem" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "productId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CompareItem" OWNER TO marketai;

--
-- Name: FavoriteItem; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."FavoriteItem" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "productId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FavoriteItem" OWNER TO marketai;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."Product" (
    id integer NOT NULL,
    "sellerId" text NOT NULL,
    "storeName" text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    price numeric(12,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    sku text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    "storeStatus" text DEFAULT 'ACTIVATED'::text NOT NULL,
    rating numeric(2,1) DEFAULT 0 NOT NULL,
    reviews integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Product" OWNER TO marketai;

--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    url text NOT NULL,
    "isMain" boolean DEFAULT false NOT NULL,
    "sortOrder" integer NOT NULL,
    "productId" integer NOT NULL
);


ALTER TABLE public."ProductImage" OWNER TO marketai;

--
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: marketai
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Product_id_seq" OWNER TO marketai;

--
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: marketai
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- Name: SellerLegalProfile; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."SellerLegalProfile" (
    id text NOT NULL,
    "sellerId" text NOT NULL,
    "businessType" text NOT NULL,
    "taxId" text NOT NULL,
    "legalName" text NOT NULL,
    "legalAddress" text NOT NULL,
    "bankName" text NOT NULL,
    iban text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SellerLegalProfile" OWNER TO marketai;

--
-- Name: User; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "accountId" text NOT NULL,
    "displayName" text NOT NULL,
    phone text,
    email text NOT NULL,
    "deliveryCity" text,
    "deliveryStreet" text,
    "deliveryHouse" text,
    "deliveryFlat" text,
    "deliveryComment" text,
    "birthDate" timestamp(3) without time zone,
    gender text,
    avatar text
);


ALTER TABLE public."User" OWNER TO marketai;

--
-- Name: UserSeller; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public."UserSeller" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "storeName" text NOT NULL,
    status public."SellerStatus" DEFAULT 'PENDING_LEGAL_DATA'::public."SellerStatus" NOT NULL,
    "agreementAcceptedAt" timestamp(3) without time zone NOT NULL,
    "legalName" text,
    inn text,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ownerEmail" text NOT NULL,
    "ownerName" text NOT NULL,
    "reviewComment" text,
    "submittedAt" timestamp(3) without time zone,
    "reviewedAt" timestamp(3) without time zone,
    email text NOT NULL,
    "logoUrl" text,
    description text,
    city text
);


ALTER TABLE public."UserSeller" OWNER TO marketai;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO marketai;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public.order_items (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    product_id integer NOT NULL,
    seller_id text NOT NULL,
    product_title_snapshot text NOT NULL,
    product_price_snapshot numeric(12,2) NOT NULL,
    quantity integer NOT NULL,
    line_total numeric(12,2) NOT NULL
);


ALTER TABLE public.order_items OWNER TO marketai;

--
-- Name: order_payments; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public.order_payments (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    provider public.order_payment_provider NOT NULL,
    provider_payment_id text,
    status public.order_payment_status DEFAULT 'pending'::public.order_payment_status NOT NULL,
    amount numeric(12,2) NOT NULL,
    raw_payload jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.order_payments OWNER TO marketai;

--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public.order_status_history (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    kind public.order_status_history_kind DEFAULT 'order'::public.order_status_history_kind NOT NULL,
    from_status text,
    to_status text NOT NULL,
    source public.order_status_history_source NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_status_history OWNER TO marketai;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: marketai
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    public_id text NOT NULL,
    buyer_id text NOT NULL,
    status public.order_status DEFAULT 'awaiting_payment'::public.order_status NOT NULL,
    payment_status public.order_payment_status DEFAULT 'pending'::public.order_payment_status NOT NULL,
    fulfillment_status public.order_fulfillment_status DEFAULT 'new'::public.order_fulfillment_status NOT NULL,
    delivery_method text NOT NULL,
    payment_method text NOT NULL,
    currency character varying(3) DEFAULT 'RUB'::character varying NOT NULL,
    items_total numeric(12,2) NOT NULL,
    delivery_total numeric(12,2) DEFAULT 0 NOT NULL,
    discount_total numeric(12,2) DEFAULT 0 NOT NULL,
    grand_total numeric(12,2) NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text NOT NULL,
    delivery_city text NOT NULL,
    delivery_street text NOT NULL,
    delivery_house text NOT NULL,
    delivery_flat text,
    delivery_comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    paid_at timestamp(3) without time zone,
    cancelled_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    cancellation_reason text
);


ALTER TABLE public.orders OWNER TO marketai;

--
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."Account" (id, email, "isEmailVerified", "verificationCode", "verificationCodeExpires", "createdAt", "updatedAt") FROM stdin;
cmq8bhu6u00025wirif3af0hf	egor@egor.com	t	\N	\N	2026-06-10 17:03:08.311	2026-06-10 17:04:14.035
cmq96h0wn00005gir29ymlc4d	test@test.com	f	$2b$08$w.G7nY0WIZVMlDhJWcTF7ue6knGxioeoBugN9UyS0er9E1JyGZzfK	2026-06-11 07:45:18.427	2026-06-11 07:30:18.455	2026-06-11 07:30:18.455
cmq96ijp400035girvepv1hxb	test1@egor.com	t	\N	\N	2026-06-11 07:31:29.464	2026-06-11 07:32:42.808
cmq96kmw000065girlmcdzoom	admintest@test.ru	t	\N	\N	2026-06-11 07:33:06.912	2026-06-11 07:33:11.362
\.


--
-- Data for Name: AccountCredential; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."AccountCredential" (id, "accountId", scope, "passwordHash", "refreshTokenHash", "resetCode", "resetCodeExpires", "createdAt", "updatedAt") FROM stdin;
cmq96h0wp00025girfl1vpqa2	cmq96h0wn00005gir29ymlc4d	BUYER	$2b$10$MHUCSMCXfhRGQzZ/v/FA9ejY6pP.rh9JaI4Yn5h/qRuRynzkPkTBO	\N	\N	\N	2026-06-11 07:30:18.455	2026-06-11 07:30:18.455
cmq96ijp500055girqwny1kt9	cmq96ijp400035girvepv1hxb	BUYER	$2b$10$8t..4tTT3N5yu8Mqs4IQoObJYEYFRr2GBKvpEgbbNj7gY3LZuM2hS	\N	\N	\N	2026-06-11 07:31:29.464	2026-06-11 07:32:48.809
cmq8bhu6y00045wirf7l2vc8c	cmq8bhu6u00025wirif3af0hf	BUYER	$2b$10$LHYiE1Xpt4PO2NLrk3NukOu5gNxjcKyT5K8svHvI29FxqOoh8xduS	$2b$10$BRjWIvf6qLgRGX3atRsk9OXpX7PWaUxbt/FLf5/Okhi26OiqM1x4S	\N	\N	2026-06-10 17:03:08.311	2026-06-11 07:47:43.558
cmq96kmw200085gir4vbgmx27	cmq96kmw000065girlmcdzoom	BUYER	$2b$10$95EQBkw2rZ0V14xCcy0j5.1QtqGYw.9KhWg0WSFFmAR7tZGZ86m62	$2b$10$DzDsQjd79wKnw7.Ihca3reRx9Dh52jxWgAa9rB7oi/OvUNmeUjE66	\N	\N	2026-06-11 07:33:06.912	2026-06-11 07:49:25.027
cmq8bj5fz0001doirpeq8bujk	cmq8bhu6u00025wirif3af0hf	SELLER	$2b$10$Fl23vK/4I5MnO6rtiRlzLOqiHDtUx4zmMCqrv0AQPRJWBUGqIo.5.	$2b$10$GUomMCXhF.aGjMXomd3L4O3OOcVUPJftpmY.fjqJUxnSEth8qu/Cq	\N	\N	2026-06-10 17:04:09.551	2026-06-11 07:56:28.286
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."CartItem" (id, "accountId", "productId", quantity, "createdAt", "updatedAt") FROM stdin;
cmq8b8fgs0004pkirla7sbcfm	cmq8anwy70003ywirpbeuwkqj	6	1	2026-06-10 16:55:49.324	2026-06-10 16:55:49.324
cmq96kqfd0001icir3rvizyse	cmq96kmw000065girlmcdzoom	28	1	2026-06-11 07:33:11.497	2026-06-11 07:33:11.497
\.


--
-- Data for Name: CompareItem; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."CompareItem" (id, "accountId", "productId", "createdAt") FROM stdin;
cmq96m5tw0003icirw08h4t5c	cmq96kmw000065girlmcdzoom	28	2026-06-11 07:34:18.116
\.


--
-- Data for Name: FavoriteItem; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."FavoriteItem" (id, "accountId", "productId", "createdAt") FROM stdin;
cmq8axoz50001pkirz9pf5yt0	cmq8anaay0000ywirf8glj5w8	4	2026-06-10 16:47:28.433
cmq8axpg10002pkirywmslw3k	cmq8anaay0000ywirf8glj5w8	10	2026-06-10 16:47:29.041
cmq8axptu0003pkirwen1inlm	cmq8anaay0000ywirf8glj5w8	1	2026-06-10 16:47:29.538
cmq96m0880002icirctpy9f6g	cmq96kmw000065girlmcdzoom	28	2026-06-11 07:34:10.856
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."Product" (id, "sellerId", "storeName", name, category, price, stock, status, "createdAt", "updatedAt", sku, description, "storeStatus", rating, reviews) FROM stdin;
11	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Iphone 16 Pro Max 256GB	Смартфоны	119000.00	11	draft	2026-06-10 17:06:30.305	2026-06-11 07:56:53.702	IPHONE1	Самый крутой телефон	ACTIVATED	0.0	0
12	cmq8bhu6u00025wirif3af0hf	TECH-GURU	iPhone 15 128GB	Смартфоны	129990.00	12	draft	2026-06-10 17:06:30.307	2026-06-11 07:56:53.702	SKU-001	Короткое описание товара	ACTIVATED	0.0	0
13	cmq8bhu6u00025wirif3af0hf	TECH-GURU	IPHONE 13 512GB	Смартфоны	39000.00	13	draft	2026-06-10 17:06:30.309	2026-06-11 07:56:53.702	IPHONE2	НЕфывыфвыфв	ACTIVATED	0.0	0
25	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Lenovo IdeaPad Slim 5 14 16/512GB	Ноутбуки	66990.00	10	active	2026-06-10 17:06:30.331	2026-06-11 07:56:53.702	SKU-015	Компактный ноутбук с металлическим корпусом	ACTIVATED	0.0	0
26	cmq8bhu6u00025wirif3af0hf	TECH-GURU	HP Pavilion 15 i5 16/512GB	Ноутбуки	64990.00	8	active	2026-06-10 17:06:30.332	2026-06-11 07:56:53.702	SKU-016	Ноутбук для работы, просмотра контента и многозадачности	ACTIVATED	0.0	0
39	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Sony WH-1000XM5	Наушники	34990.00	9	active	2026-06-10 17:06:30.346	2026-06-11 07:56:53.702	SKU-029	Полноразмерные наушники с сильным шумоподавлением	ACTIVATED	0.0	0
40	cmq8bhu6u00025wirif3af0hf	TECH-GURU	JBL Tune 720BT	Наушники	6990.00	31	active	2026-06-10 17:06:30.347	2026-06-11 07:56:53.702	SKU-030	Беспроводные наушники с долгим временем работы	ACTIVATED	0.0	0
41	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Marshall Major IV	Наушники	13990.00	14	active	2026-06-10 17:06:30.348	2026-06-11 07:56:53.702	SKU-032	Беспроводные наушники с фирменным дизайном	ACTIVATED	0.0	0
42	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Anker Soundcore Liberty 4 NC	Наушники	8990.00	23	active	2026-06-10 17:06:30.349	2026-06-11 07:56:53.702	SKU-031	TWS-наушники с шумоподавлением и удобной посадкой	ACTIVATED	0.0	0
43	cmq8bhu6u00025wirif3af0hf	TECH-GURU	JBL Charge 5	Аудиотехника	15990.00	13	draft	2026-06-10 17:06:30.35	2026-06-11 07:56:53.702	SKU-034	Колонка с мощным звуком и функцией пауэрбанка	ACTIVATED	0.0	0
44	cmq8bhu6u00025wirif3af0hf	TECH-GURU	JBL Flip 6	Аудиотехника	10990.00	19	draft	2026-06-10 17:06:30.351	2026-06-11 07:56:53.702	SKU-033	Портативная колонка с влагозащитой	ACTIVATED	0.0	0
45	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Marshall Emberton II	Аудиотехника	17990.00	8	draft	2026-06-10 17:06:30.352	2026-06-11 07:56:53.702	SKU-035	Компактная колонка с насыщенным звучанием	ACTIVATED	0.0	0
46	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Яндекс Станция Миди	Аудиотехника	14990.00	16	draft	2026-06-10 17:06:30.353	2026-06-11 07:56:53.702	SKU-036	Умная колонка с голосовым помощником	ACTIVATED	0.0	0
47	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Logitech MX Master 3S	Компьютеры и периферия	9990.00	18	draft	2026-06-10 17:06:30.353	2026-06-11 07:56:53.702	SKU-038	Эргономичная мышь для работы и дизайна	ACTIVATED	0.0	0
48	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Sony SRS-XB100	Аудиотехника	4990.00	24	draft	2026-06-10 17:06:30.354	2026-06-11 07:56:53.702	SKU-037	Небольшая портативная колонка для поездок	ACTIVATED	0.0	0
49	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Logitech MX Keys S	Компьютеры и периферия	11990.00	12	draft	2026-06-10 17:06:30.355	2026-06-11 07:56:53.702	SKU-039	Беспроводная клавиатура с тихим ходом клавиш	ACTIVATED	0.0	0
50	cmq8bhu6u00025wirif3af0hf	TECH-GURU	HyperX Alloy Origins Core	Компьютеры и периферия	8990.00	10	draft	2026-06-10 17:06:30.356	2026-06-11 07:56:53.702	SKU-041	Компактная механическая клавиатура	ACTIVATED	0.0	0
51	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Razer DeathAdder V3	Компьютеры и периферия	6990.00	15	draft	2026-06-10 17:06:30.356	2026-06-11 07:56:53.702	SKU-040	Игровая мышь с точным сенсором	ACTIVATED	0.0	0
52	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Kingston NV2 1TB SSD	Компьютеры и периферия	6490.00	32	draft	2026-06-10 17:06:30.357	2026-06-11 07:56:53.702	SKU-042	NVMe SSD для ускорения компьютера	ACTIVATED	0.0	0
53	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Logitech C920 HD Pro	Компьютеры и периферия	7990.00	11	draft	2026-06-10 17:06:30.358	2026-06-11 07:56:53.702	SKU-044	Веб-камера для видеозвонков и стримов	ACTIVATED	0.0	0
54	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Samsung 990 EVO 1TB SSD	Компьютеры и периферия	9990.00	17	draft	2026-06-10 17:06:30.359	2026-06-11 07:56:53.702	SKU-043	Быстрый SSD для рабочих станций и игр	ACTIVATED	0.0	0
55	cmq8bhu6u00025wirif3af0hf	TECH-GURU	A4Tech Bloody B820R	Компьютеры и периферия	4290.00	21	draft	2026-06-10 17:06:30.359	2026-06-11 07:56:53.702	SKU-045	Механическая клавиатура с подсветкой	ACTIVATED	0.0	0
56	cmq8bhu6u00025wirif3af0hf	TECH-GURU	AOC 24G2SPU 24	Мониторы	18990.00	14	draft	2026-06-10 17:06:30.36	2026-06-11 07:56:53.702	SKU-048	Быстрый монитор с частотой 165 Гц	ACTIVATED	0.0	0
57	cmq8bhu6u00025wirif3af0hf	TECH-GURU	LG UltraGear 27GN800-B 27	Мониторы	27990.00	9	draft	2026-06-10 17:06:30.36	2026-06-11 07:56:53.702	SKU-046	Игровой монитор с разрешением QHD	ACTIVATED	0.0	0
58	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Samsung Odyssey G5 27	Мониторы	29990.00	7	draft	2026-06-10 17:06:30.361	2026-06-11 07:56:53.702	SKU-047	Изогнутый монитор для игр и работы	ACTIVATED	0.0	0
59	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Dell S2722QC 27 4K	Мониторы	38990.00	6	draft	2026-06-10 17:06:30.362	2026-06-11 07:56:53.702	SKU-050	4K-монитор для работы с текстом и графикой	ACTIVATED	0.0	0
60	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Xiaomi Monitor A27i	Мониторы	12990.00	18	draft	2026-06-10 17:06:30.363	2026-06-11 07:56:53.702	SKU-049	Тонкий монитор для офиса и дома	ACTIVATED	0.0	0
61	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Яндекс Станция Лайт 2	Умный дом	5990.00	28	draft	2026-06-10 17:06:30.364	2026-06-11 07:56:53.702	SKU-052	Компактная умная колонка для управления домом	ACTIVATED	0.0	0
62	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Acer Nitro VG240Y 24	Мониторы	14990.00	13	draft	2026-06-10 17:06:30.365	2026-06-11 07:56:53.702	SKU-051	Монитор для игр и повседневных задач	ACTIVATED	0.0	0
63	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Умная лампа Яндекс E27	Умный дом	1290.00	45	draft	2026-06-10 17:06:30.365	2026-06-11 07:56:53.702	SKU-053	Лампа с регулировкой яркости и цвета	ACTIVATED	0.0	0
64	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Умная розетка Яндекс	Умный дом	1490.00	39	draft	2026-06-10 17:06:30.366	2026-06-11 07:56:53.702	SKU-054	Розетка для удалённого управления техникой	ACTIVATED	0.0	0
65	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Aqara Hub M2	Умный дом	6990.00	12	draft	2026-06-10 17:06:30.367	2026-06-11 07:56:53.702	SKU-055	Центр управления устройствами умного дома	ACTIVATED	0.0	0
67	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Xiaomi Smart Camera C300	Умный дом	3990.00	17	draft	2026-06-10 17:06:30.368	2026-06-11 07:56:53.702	SKU-057	Домашняя камера с поворотным механизмом	ACTIVATED	0.0	0
68	cmq8bhu6u00025wirif3af0hf	TECH-GURU	LG OLED C4 55	ТВ и видеотехника	149990.00	3	draft	2026-06-10 17:06:30.369	2026-06-11 07:56:53.702	SKU-058	OLED-телевизор с глубоким чёрным цветом	ACTIVATED	0.0	0
69	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Samsung QLED Q60D 55	ТВ и видеотехника	84990.00	5	draft	2026-06-10 17:06:30.369	2026-06-11 07:56:53.702	SKU-059	QLED-телевизор для фильмов и игр	ACTIVATED	0.0	0
70	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Xiaomi TV A Pro 43	ТВ и видеотехника	32990.00	13	draft	2026-06-10 17:06:30.37	2026-06-11 07:56:53.702	SKU-060	Умный телевизор с 4K-разрешением	ACTIVATED	0.0	0
71	cmq8bhu6u00025wirif3af0hf	TECH-GURU	TCL 55C645 QLED	ТВ и видеотехника	49990.00	9	draft	2026-06-10 17:06:30.371	2026-06-11 07:56:53.702	SKU-061	QLED-телевизор с яркой картинкой	ACTIVATED	0.0	0
72	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Яндекс ТВ Станция 43	ТВ и видеотехника	39990.00	8	draft	2026-06-10 17:06:30.372	2026-06-11 07:56:53.702	SKU-062	Телевизор с голосовым управлением	ACTIVATED	0.0	0
73	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Apple TV 4K 128GB	ТВ и видеотехника	21990.00	11	draft	2026-06-10 17:06:30.372	2026-06-11 07:56:53.702	SKU-063	Медиаплеер для потокового видео и игр	ACTIVATED	0.0	0
74	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Чехол iPhone 15 Silicone Case	Аксессуары	2990.00	44	draft	2026-06-10 17:06:30.373	2026-06-11 07:56:53.702	SKU-064	Силиконовый чехол с приятным покрытием	ACTIVATED	0.0	0
75	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Зарядное устройство Apple 20W USB-C	Аксессуары	2490.00	37	draft	2026-06-10 17:06:30.373	2026-06-11 07:56:53.702	SKU-065	Компактный адаптер для быстрой зарядки	ACTIVATED	0.0	0
76	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Кабель USB-C to USB-C 1 м	Аксессуары	990.00	58	draft	2026-06-10 17:06:30.374	2026-06-11 07:56:53.702	SKU-066	Кабель для зарядки и передачи данных	ACTIVATED	0.0	0
77	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Power Bank Xiaomi 20000 mAh	Аксессуары	3490.00	29	draft	2026-06-10 17:06:30.375	2026-06-11 07:56:53.702	SKU-067	Внешний аккумулятор для смартфонов и планшетов	ACTIVATED	0.0	0
78	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Защитное стекло iPhone 15	Аксессуары	790.00	66	draft	2026-06-10 17:06:30.376	2026-06-11 07:56:53.702	SKU-068	Прочное стекло для защиты экрана	ACTIVATED	0.0	0
79	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Сумка для ноутбука 15.6	Аксессуары	2190.00	24	draft	2026-06-10 17:06:30.376	2026-06-11 07:56:53.702	SKU-069	Сумка с мягким отделением для ноутбука	ACTIVATED	0.0	0
80	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Худи oversize с капюшоном	Одежда	3490.00	31	draft	2026-06-10 17:06:30.377	2026-06-11 07:56:53.702	SKU-071	Тёплое худи свободного кроя	ACTIVATED	0.0	0
81	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Футболка базовая хлопковая	Одежда	1290.00	52	draft	2026-06-10 17:06:30.378	2026-06-11 07:56:53.702	SKU-070	Повседневная хлопковая футболка	ACTIVATED	0.0	0
82	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Джинсы прямого кроя	Одежда	3990.00	22	draft	2026-06-10 17:06:30.378	2026-06-11 07:56:53.702	SKU-072	Универсальные джинсы на каждый день	ACTIVATED	0.0	0
83	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Куртка демисезонная	Одежда	6990.00	14	draft	2026-06-10 17:06:30.379	2026-06-11 07:56:53.702	SKU-073	Лёгкая куртка для прохладной погоды	ACTIVATED	0.0	0
84	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Рубашка классическая	Одежда	2490.00	19	draft	2026-06-10 17:06:30.38	2026-06-11 07:56:53.702	SKU-074	Рубашка для офиса и повседневных образов	ACTIVATED	0.0	0
85	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Кроссовки Nike Air Max	Обувь	12990.00	10	draft	2026-06-10 17:06:30.38	2026-06-11 07:56:53.702	SKU-075	Повседневные кроссовки с амортизацией	ACTIVATED	0.0	0
93	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Скакалка скоростная	Спорт	690.00	48	draft	2026-06-10 17:06:30.385	2026-06-11 07:56:53.702	SKU-083	Скакалка для кардио и разминки	ACTIVATED	0.0	0
94	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Пылесос Xiaomi G20 Lite	Дом и быт	13990.00	9	draft	2026-06-10 17:06:30.386	2026-06-11 07:56:53.702	SKU-085	Вертикальный пылесос для быстрой уборки	ACTIVATED	0.0	0
95	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Рюкзак спортивный 30 л	Спорт	2490.00	23	draft	2026-06-10 17:06:30.387	2026-06-11 07:56:53.702	SKU-084	Лёгкий рюкзак для тренировок и поездок	ACTIVATED	0.0	0
96	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Робот-пылесос Dreame D10 Plus	Дом и быт	32990.00	6	draft	2026-06-10 17:06:30.387	2026-06-11 07:56:53.702	SKU-086	Робот-пылесос с базой самоочистки	ACTIVATED	0.0	0
97	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Утюг Philips EasySpeed	Дом и быт	3490.00	17	draft	2026-06-10 17:06:30.388	2026-06-11 07:56:53.702	SKU-087	Утюг с паровым ударом для ежедневного ухода	ACTIVATED	0.0	0
98	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Микроволновая печь Samsung 23 л	Дом и быт	11990.00	8	draft	2026-06-10 17:06:30.389	2026-06-11 07:56:53.702	SKU-088	Микроволновая печь с простым управлением	ACTIVATED	0.0	0
99	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Электрочайник Kitfort 1.7 л	Дом и быт	2490.00	21	draft	2026-06-10 17:06:30.39	2026-06-11 07:56:53.702	SKU-089	Чайник с автоотключением и подсветкой	ACTIVATED	0.0	0
100	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Кофеварка рожковая DeLonghi	Дом и быт	17990.00	5	draft	2026-06-10 17:06:30.391	2026-06-11 07:56:53.702	SKU-090	Кофеварка для эспрессо и капучино	ACTIVATED	0.0	0
101	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Фен Dyson Supersonic	Красота и здоровье	42990.00	4	draft	2026-06-10 17:06:30.391	2026-06-11 07:56:53.702	SKU-091	Фен с быстрым высушиванием и контролем температуры	ACTIVATED	0.0	0
102	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Фен Rowenta Powerline	Красота и здоровье	3490.00	20	draft	2026-06-10 17:06:30.392	2026-06-11 07:56:53.702	SKU-092	Фен для ежедневной укладки волос	ACTIVATED	0.0	0
103	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Электрическая зубная щётка Oral-B Pro 3	Красота и здоровье	5990.00	18	draft	2026-06-10 17:06:30.393	2026-06-11 07:56:53.702	SKU-093	Щётка с датчиком давления и таймером	ACTIVATED	0.0	0
104	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Ирригатор Xiaomi Mijia	Красота и здоровье	3990.00	16	draft	2026-06-10 17:06:30.394	2026-06-11 07:56:53.702	SKU-094	Портативный ирригатор для ухода за полостью рта	ACTIVATED	0.0	0
105	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Массажёр для шеи Xiaomi	Красота и здоровье	2990.00	13	draft	2026-06-10 17:06:30.394	2026-06-11 07:56:53.702	SKU-095	Компактный массажёр для расслабления мышц	ACTIVATED	0.0	0
106	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Триммер Philips OneBlade	Красота и здоровье	4490.00	15	draft	2026-06-10 17:06:30.395	2026-06-11 07:56:53.702	SKU-096	Универсальный триммер для лица и тела	ACTIVATED	0.0	0
107	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Умные весы Picooc Mini	Красота и здоровье	2490.00	22	draft	2026-06-10 17:06:30.396	2026-06-11 07:56:53.702	SKU-097	Весы с анализом состава тела	ACTIVATED	0.0	0
108	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Паровая швабра Kitfort KT-1005	Дом и быт	4990.00	10	draft	2026-06-10 17:06:30.397	2026-06-11 07:56:53.702	SKU-098	Швабра для быстрой влажной уборки без лишней химии	ACTIVATED	0.0	0
109	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Спортивная бутылка 750 мл	Спорт	790.00	55	draft	2026-06-10 17:06:30.398	2026-06-11 07:56:53.702	SKU-099	Лёгкая бутылка для тренировок и прогулок	ACTIVATED	0.0	0
17	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Xiaomi Redmi Note 13 Pro 256GB	Смартфоны	27990.00	34	active	2026-06-10 17:06:30.315	2026-06-11 07:56:53.702	SKU-006	Смартфон с большим экраном и быстрой зарядкой	ACTIVATED	0.0	0
14	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Samsung Galaxy A55 128GB	Смартфоны	32990.00	27	draft	2026-06-10 17:06:30.311	2026-06-11 07:56:53.702	SKU-005	Смартфон среднего класса с хорошей автономностью	ACTIVATED	0.0	0
15	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Samsung Galaxy S24 256GB	Смартфоны	74990.00	18	draft	2026-06-10 17:06:30.312	2026-06-11 07:56:53.702	SKU-004	Флагманский смартфон с ярким AMOLED-экраном и мощной камерой	ACTIVATED	0.0	0
16	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Xiaomi 14T 512GB	Смартфоны	59990.00	16	draft	2026-06-10 17:06:30.313	2026-06-11 07:56:53.702	SKU-007	Производительный смартфон для фото, игр и повседневных задач	ACTIVATED	0.0	0
27	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Acer Nitro V 15 RTX 4050	Ноутбуки	89990.00	5	active	2026-06-10 17:06:30.333	2026-06-11 07:56:53.702	SKU-017	Игровой ноутбук с дискретной видеокартой	ACTIVATED	0.0	0
28	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Huawei MateBook D16 i5 16/512GB	Ноутбуки	73990.00	6	active	2026-06-10 17:06:30.334	2026-06-11 07:56:53.702	SKU-019	Ноутбук с большим экраном и тонкими рамками	ACTIVATED	0.0	0
29	cmq8bhu6u00025wirif3af0hf	TECH-GURU	MSI Modern 14 16/512GB	Ноутбуки	52990.00	13	active	2026-06-10 17:06:30.334	2026-06-11 07:56:53.702	SKU-018	Лёгкий ноутбук для ежедневной работы	ACTIVATED	0.0	0
30	cmq8bhu6u00025wirif3af0hf	TECH-GURU	iPad 10 64GB Wi-Fi	Планшеты	44990.00	17	active	2026-06-10 17:06:30.336	2026-06-11 07:56:53.702	SKU-020	Планшет для учёбы, заметок и просмотра видео	ACTIVATED	0.0	0
31	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Samsung Galaxy Tab S9 FE 128GB	Планшеты	42990.00	15	active	2026-06-10 17:06:30.338	2026-06-11 07:56:53.702	SKU-022	Планшет с пером для заметок и рисования	ACTIVATED	0.0	0
32	cmq8bhu6u00025wirif3af0hf	TECH-GURU	iPad Air 11 M2 128GB	Планшеты	74990.00	8	active	2026-06-10 17:06:30.339	2026-06-11 07:56:53.702	SKU-021	Мощный планшет для творчества и работы	ACTIVATED	0.0	0
33	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Xiaomi Pad 6 128GB	Планшеты	32990.00	20	active	2026-06-10 17:06:30.34	2026-06-11 07:56:53.702	SKU-023	Планшет с плавным экраном и металлическим корпусом	ACTIVATED	0.0	0
34	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Lenovo Tab P12 128GB	Планшеты	34990.00	11	active	2026-06-10 17:06:30.341	2026-06-11 07:56:53.702	SKU-024	Планшет с большим экраном для фильмов и учебы	ACTIVATED	0.0	0
35	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Huawei MatePad 11.5 128GB	Планшеты	29990.00	18	active	2026-06-10 17:06:30.342	2026-06-11 07:56:53.702	SKU-025	Планшет для работы с документами и мультимедиа	ACTIVATED	0.0	0
36	cmq8bhu6u00025wirif3af0hf	TECH-GURU	AirPods Pro 2 USB-C	Наушники	24990.00	21	active	2026-06-10 17:06:30.343	2026-06-11 07:56:53.702	SKU-026	Беспроводные наушники с активным шумоподавлением	ACTIVATED	0.0	0
37	cmq8bhu6u00025wirif3af0hf	TECH-GURU	AirPods 3	Наушники	16990.00	25	active	2026-06-10 17:06:30.344	2026-06-11 07:56:53.702	SKU-027	Лёгкие наушники для звонков и музыки	ACTIVATED	0.0	0
38	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Samsung Galaxy Buds 3 Pro	Наушники	19990.00	18	active	2026-06-10 17:06:30.345	2026-06-11 07:56:53.702	SKU-028	Компактные наушники с чистым звуком	ACTIVATED	0.0	0
66	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Aqara Door Sensor	Умный дом	1890.00	26	draft	2026-06-10 17:06:30.367	2026-06-11 07:56:53.702	SKU-056	Датчик открытия дверей и окон	ACTIVATED	0.0	0
18	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Google Pixel 8 128GB	Смартфоны	54990.00	9	draft	2026-06-10 17:06:30.316	2026-06-11 07:56:53.702	SKU-008	Смартфон с чистым Android и качественной камерой	ACTIVATED	0.0	0
19	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Realme 12 Pro 256GB	Смартфоны	29990.00	22	active	2026-06-10 17:06:30.318	2026-06-11 07:56:53.702	SKU-009	Смартфон с плавным экраном и стильным корпусом	ACTIVATED	0.0	0
20	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Honor 90 256GB	Смартфоны	34990.00	14	active	2026-06-10 17:06:30.319	2026-06-11 07:56:53.702	SKU-010	Тонкий смартфон с высокой детализацией экрана	ACTIVATED	0.0	0
21	cmq8bhu6u00025wirif3af0hf	TECH-GURU	MacBook Air 13 M2 256GB	Ноутбуки	94990.00	7	active	2026-06-10 17:06:30.321	2026-06-11 07:56:53.702	SKU-012	Лёгкий ноутбук для учёбы, работы и поездок	ACTIVATED	0.0	0
22	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Nothing Phone 2a 256GB	Смартфоны	35990.00	11	active	2026-06-10 17:06:30.326	2026-06-11 07:56:53.702	SKU-011	Смартфон с необычным дизайном и стабильной производительностью	ACTIVATED	0.0	0
23	cmq8bhu6u00025wirif3af0hf	TECH-GURU	MacBook Air 15 M3 512GB	Ноутбуки	154990.00	4	active	2026-06-10 17:06:30.328	2026-06-11 07:56:53.702	SKU-013	Тонкий ноутбук с большим экраном и высокой автономностью	ACTIVATED	0.0	0
24	cmq8bhu6u00025wirif3af0hf	TECH-GURU	ASUS VivoBook 15 Ryzen 5 16/512GB	Ноутбуки	57990.00	12	active	2026-06-10 17:06:30.33	2026-06-11 07:56:53.702	SKU-014	Универсальный ноутбук для офиса и обучения	ACTIVATED	0.0	0
110	cmq8bhu6u00025wirif3af0hf	TECH-GURU	123	Ноутбуки	123.00	2	draft	2026-06-10 17:06:30.398	2026-06-11 07:56:53.702	12	123123sdaass	ACTIVATED	0.0	0
86	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Кроссовки Adidas Runfalcon	Обувь	6990.00	18	draft	2026-06-10 17:06:30.381	2026-06-11 07:56:53.702	SKU-076	Лёгкие кроссовки для прогулок и тренировок	ACTIVATED	0.0	0
87	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Кеды Converse Chuck Taylor	Обувь	7990.00	9	draft	2026-06-10 17:06:30.381	2026-06-11 07:56:53.702	SKU-078	Классические кеды для повседневного стиля	ACTIVATED	0.0	0
88	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Ботинки зимние утеплённые	Обувь	8990.00	12	draft	2026-06-10 17:06:30.382	2026-06-11 07:56:53.702	SKU-077	Тёплая обувь для холодной погоды	ACTIVATED	0.0	0
89	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Кроссовки Puma Flyer Runner	Обувь	5990.00	16	draft	2026-06-10 17:06:30.383	2026-06-11 07:56:53.702	SKU-079	Удобные кроссовки для активного дня	ACTIVATED	0.0	0
90	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Гантели разборные 20 кг	Спорт	5490.00	15	draft	2026-06-10 17:06:30.383	2026-06-11 07:56:53.702	SKU-080	Набор гантелей для домашних тренировок	ACTIVATED	0.0	0
91	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Коврик для йоги 6 мм	Спорт	1290.00	34	draft	2026-06-10 17:06:30.384	2026-06-11 07:56:53.702	SKU-081	Нескользящий коврик для фитнеса и растяжки	ACTIVATED	0.0	0
92	cmq8bhu6u00025wirif3af0hf	TECH-GURU	Велотренажёр домашний	Спорт	18990.00	4	draft	2026-06-10 17:06:30.385	2026-06-11 07:56:53.702	SKU-082	Компактный тренажёр для кардио дома	ACTIVATED	0.0	0
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."ProductImage" (id, url, "isMain", "sortOrder", "productId") FROM stdin;
\.


--
-- Data for Name: SellerLegalProfile; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."SellerLegalProfile" (id, "sellerId", "businessType", "taxId", "legalName", "legalAddress", "bankName", iban, "createdAt", "updatedAt") FROM stdin;
cmq8bjquo0002doirc6gdoh6h	cmq8bj5fx0000doirc3prlpcg	individual	213333333333	12333333333333333	asdasd	asdasd	12333333333333333333	2026-06-10 17:04:37.296	2026-06-10 17:04:37.296
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."User" (id, "createdAt", "updatedAt", "accountId", "displayName", phone, email, "deliveryCity", "deliveryStreet", "deliveryHouse", "deliveryFlat", "deliveryComment", "birthDate", gender, avatar) FROM stdin;
cmq96h0wo00015giroyv4eym7	2026-06-11 07:30:18.455	2026-06-11 07:30:18.455	cmq96h0wn00005gir29ymlc4d	test	\N	test@test.com	\N	\N	\N	\N	\N	\N	\N	\N
cmq96ijp400045girskjb2juu	2026-06-11 07:31:29.464	2026-06-11 07:31:29.464	cmq96ijp400035girvepv1hxb	test1	\N	test1@egor.com	\N	\N	\N	\N	\N	\N	\N	\N
cmq96kmw100075girhtp2tp6d	2026-06-11 07:33:06.912	2026-06-11 07:36:01.934	cmq96kmw000065girlmcdzoom	Егор	+71111111111	admintest@test.ru	Ekat	sadsa	11	33	22	2000-11-10 19:00:00	male	data:image/jpeg;base64,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
cmq8bhu6w00035wirh4hhvqw1	2026-06-10 17:03:08.311	2026-06-11 07:56:07.326	cmq8bhu6u00025wirif3af0hf	Egor	+72222222222	egor@egor.com	sadasd	213	123	123	asd	2000-11-10 19:00:00	\N	data:image/jpeg;base64,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
\.


--
-- Data for Name: UserSeller; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public."UserSeller" (id, "accountId", "storeName", status, "agreementAcceptedAt", "legalName", inn, phone, "createdAt", "updatedAt", "ownerEmail", "ownerName", "reviewComment", "submittedAt", "reviewedAt", email, "logoUrl", description, city) FROM stdin;
cmq8bj5fx0000doirc3prlpcg	cmq8bhu6u00025wirif3af0hf	TECH-GURU	ACTIVATED	2026-06-10 17:04:09.542	\N	\N		2026-06-10 17:04:09.549	2026-06-11 07:56:53.653	egor@egor.com	Egor	\N	2026-06-10 17:04:37.35	2026-06-10 17:04:41.044	egor@egor.com	\N		
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e8eaad5b-e0e3-47e5-b3ba-a6214761fb14	91e0980689b63e0c80c9161cfb588b9b4ad06ea927c3bb6aa3cacd0b8c6522aa	2026-06-10 16:30:57.379827+00	20260523111201_add_user_model	\N	\N	2026-06-10 16:30:57.280135+00	1
1d2835c0-0143-47a7-82b4-e0b3328312c5	ba1c20e09562ef2fd4a5b6b9bf126cabb3442577ea928a51eff15c93e6292798	2026-06-10 16:30:57.476149+00	20260526190000_account_profiles	\N	\N	2026-06-10 16:30:57.383434+00	1
2ee721ad-1649-49f9-98b6-d51d4b9242f0	4662d78c7f6b35b8a342c219417e9630cbd513f2797620c5700d5da916550ddb	2026-06-10 16:31:07.291201+00	20260531120000_shopping_state	\N	\N	2026-06-10 16:31:07.145823+00	1
c6ad965d-8700-46e3-86c6-b8bd68dc05a9	02539786dbb8492ddd8e84a63185cb5833ff109081cb54a32535670270f80727	2026-06-10 16:30:57.532708+00	20260527120000_scoped_account_credentials	\N	\N	2026-06-10 16:30:57.480783+00	1
a66e636a-ed0e-4dad-8b02-330961d44495	822fd1dc9c48258a4a5b4a82c1d8518df1aec6af4a6da0eb6461dfb393659978	2026-06-10 16:30:57.636014+00	20260531190000_seller_legal_review	\N	\N	2026-06-10 16:30:57.536465+00	1
d1e6f48b-3d63-47e8-ba13-b5986e6a3449	8715875dd307697dc198c2c9796c3ff05636e28bde906efc3b390eeaf3c2d3f4	2026-06-10 16:30:57.650358+00	20260605110000_buyer_phone_profile	\N	\N	2026-06-10 16:30:57.639633+00	1
d77f554f-55da-4a98-981c-123a253bd6a2	a9ca748960ec8a2e10c713710c4bd0ed78ff533ca386f91190aa3ad218dab6de	2026-06-10 16:31:42.367673+00	20260610000000_add_logo_url	\N	\N	2026-06-10 16:31:42.348292+00	1
6e387e92-ab4b-45cc-a721-6550ceeb70e2	8a530fb920d49eb77a231f2f0b261bc1a7e983301d5bd61e9a02b59b65052bbb	2026-06-10 16:30:57.677041+00	20260606113000_profile_email_denorm	\N	\N	2026-06-10 16:30:57.654009+00	1
e45d49d2-5e04-4cb7-9a6b-59bfddb22305	48a0f4a5f32c4b28ef25e92e2bb06c7a0a8c8749b2290f9518a9f7ad21c40768	2026-06-10 16:30:57.694611+00	20260607120000_seller_store_pause	\N	\N	2026-06-10 16:30:57.681211+00	1
0ac68671-44a9-412c-b064-1855a8ead1f8	0b0c393b4443bb7110a9dc1688eacf42371c99e5bf210a1c7c57f238426afb0d	2026-06-10 16:30:57.71121+00	20260608150000_buyer_delivery_address	\N	\N	2026-06-10 16:30:57.698561+00	1
435cd6d8-4825-402d-b137-e627fffa7f36	b2abe18f1155410b27bad914bf29d6f536b7ec876fec56fbff78df5842780ad9	2026-06-10 16:34:24.585171+00	20260606123000_order_storage_model	\N	\N	2026-06-10 16:34:24.480886+00	1
93a75b8f-b908-4176-bac4-9ab1e46978ed	a567df2884ae551cf9758a801e9f7405bd1d3c12081300f3a990d5934aa131a4	2026-06-10 16:31:01.855161+00	20260604130000_create_products	\N	\N	2026-06-10 16:31:01.785617+00	1
b4ce68a2-a6a2-49fe-aada-ec5b186091f3	8d1fbbb4ee59316463e19f4a24cd7e212d50910023c6a7ea389d3c0b80c6ffaf	2026-06-10 16:31:01.888485+00	20260604153000_add_product_sku_description	\N	\N	2026-06-10 16:31:01.859044+00	1
4059933e-7048-42c5-8022-6bae7cb7ed5e	f4d765ecb1007e98f4bbeea894f299fcc936dfa51d1e40d92881c9bb51309886	2026-06-10 16:31:01.912693+00	20260607120500_product_store_status	\N	\N	2026-06-10 16:31:01.892098+00	1
2ea30f65-7918-408c-b43b-0025f9cfea59	170d50e9a68c12bf997f174b7765a927010d2e8495ff6b2b97e2a3691e4e466c	2026-06-10 16:31:01.93339+00	20260607131500_product_rating_reviews	\N	\N	2026-06-10 16:31:01.916235+00	1
09044251-4879-4841-8ae9-f6b08153dea9	d2f837a192fc4e149a130e59a17ebdceb3fa5ca87b9be5aaa12a967ce633a6b0	2026-06-10 16:31:01.992849+00	20260608170000_product_images	\N	\N	2026-06-10 16:31:01.937611+00	1
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public.order_items (id, order_id, product_id, seller_id, product_title_snapshot, product_price_snapshot, quantity, line_total) FROM stdin;
bd9e7f91-2590-4295-a29a-e98b1ea26fc6	f1368953-0ac1-4e4d-90b2-6c5766be7d2e	10	cmq8anwy70003ywirpbeuwkqj	Спортивный костюм	5490.00	1	5490.00
\.


--
-- Data for Name: order_payments; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public.order_payments (id, order_id, provider, provider_payment_id, status, amount, raw_payload, created_at, updated_at) FROM stdin;
eaf5a456-ef3a-4e54-946b-3f61d5c5bfec	f1368953-0ac1-4e4d-90b2-6c5766be7d2e	yookassa	31bba81d-000f-5000-b000-190795ab9623	paid	5490.00	{"type": "notification", "event": "payment.succeeded", "object": {"id": "31bba81d-000f-5000-b000-190795ab9623", "paid": true, "test": true, "amount": {"value": "5490.00", "currency": "RUB"}, "status": "succeeded", "metadata": {"order_id": "f1368953-0ac1-4e4d-90b2-6c5766be7d2e"}, "recipient": {"account_id": "1378102", "gateway_id": "2760068"}, "created_at": "2026-06-10T16:44:13.062Z", "refundable": true, "captured_at": "2026-06-10T16:44:16.612Z", "description": "MarketAI order MA-20260610-AD722806 (test)", "income_amount": {"value": "5297.85", "currency": "RUB"}, "payment_method": {"id": "31bba81d-000f-5000-b000-190795ab9623", "type": "yoo_money", "saved": false, "title": "YooMoney wallet 410011758831136", "status": "inactive", "account_number": "410011758831136"}, "refunded_amount": {"value": "0.00", "currency": "RUB"}}}	2026-06-10 16:44:12.111	2026-06-10 17:00:32.973
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public.order_status_history (id, order_id, kind, from_status, to_status, source, comment, created_at) FROM stdin;
0fabced8-9f8b-4677-913a-35179b007414	f1368953-0ac1-4e4d-90b2-6c5766be7d2e	order	\N	AWAITING_PAYMENT	system	Order created from checkout	2026-06-10 16:44:12.111
a0ec439f-205c-421e-a0d7-019f4f03fa32	f1368953-0ac1-4e4d-90b2-6c5766be7d2e	payment	\N	PENDING	system	Payment pending	2026-06-10 16:44:12.111
762424c4-bf2d-451b-9c91-aa06c4e184b4	f1368953-0ac1-4e4d-90b2-6c5766be7d2e	fulfillment	\N	PROCESSING	system	Fulfillment created	2026-06-10 16:44:12.111
7ff0c5ce-90db-4409-ade1-5c97d6438492	f1368953-0ac1-4e4d-90b2-6c5766be7d2e	payment	PENDING	PAID	payment_provider	YooKassa payment succeeded	2026-06-10 16:44:16.571
46a2f3b2-5c47-40cf-acef-2bdd046bc2a8	f1368953-0ac1-4e4d-90b2-6c5766be7d2e	order	AWAITING_PAYMENT	PROCESSING	system	Order moved to processing after payment	2026-06-10 16:44:16.571
eb556652-9680-402d-9c68-7b7b44f0c7b2	f1368953-0ac1-4e4d-90b2-6c5766be7d2e	fulfillment	PROCESSING	PROCESSING	system	Fulfillment started after payment	2026-06-10 16:44:16.571
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: marketai
--

COPY public.orders (id, public_id, buyer_id, status, payment_status, fulfillment_status, delivery_method, payment_method, currency, items_total, delivery_total, discount_total, grand_total, customer_name, customer_phone, customer_email, delivery_city, delivery_street, delivery_house, delivery_flat, delivery_comment, created_at, updated_at, paid_at, cancelled_at, completed_at, cancellation_reason) FROM stdin;
f1368953-0ac1-4e4d-90b2-6c5766be7d2e	MA-20260610-AD722806	cmq8anaay0000ywirf8glj5w8	completed	paid	received	courier	card	RUB	5490.00	0.00	0.00	5490.00	Egor	+7 (121) 231-23-12	egor1@egor.com	Екатеринбург	asd	123	123	\N	2026-06-10 16:44:12.111	2026-06-10 16:44:31.824	2026-06-10 16:44:16.565	\N	2026-06-10 16:44:31.822	\N
\.


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: marketai
--

SELECT pg_catalog.setval('public."Product_id_seq"', 110, true);


--
-- Name: AccountCredential AccountCredential_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."AccountCredential"
    ADD CONSTRAINT "AccountCredential_pkey" PRIMARY KEY (id);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: CompareItem CompareItem_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."CompareItem"
    ADD CONSTRAINT "CompareItem_pkey" PRIMARY KEY (id);


--
-- Name: FavoriteItem FavoriteItem_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."FavoriteItem"
    ADD CONSTRAINT "FavoriteItem_pkey" PRIMARY KEY (id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: SellerLegalProfile SellerLegalProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."SellerLegalProfile"
    ADD CONSTRAINT "SellerLegalProfile_pkey" PRIMARY KEY (id);


--
-- Name: UserSeller UserSeller_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."UserSeller"
    ADD CONSTRAINT "UserSeller_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_payments order_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public.order_payments
    ADD CONSTRAINT order_payments_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: AccountCredential_accountId_scope_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX "AccountCredential_accountId_scope_key" ON public."AccountCredential" USING btree ("accountId", scope);


--
-- Name: Account_email_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX "Account_email_key" ON public."Account" USING btree (email);


--
-- Name: CartItem_accountId_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX "CartItem_accountId_idx" ON public."CartItem" USING btree ("accountId");


--
-- Name: CartItem_accountId_productId_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX "CartItem_accountId_productId_key" ON public."CartItem" USING btree ("accountId", "productId");


--
-- Name: CompareItem_accountId_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX "CompareItem_accountId_idx" ON public."CompareItem" USING btree ("accountId");


--
-- Name: CompareItem_accountId_productId_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX "CompareItem_accountId_productId_key" ON public."CompareItem" USING btree ("accountId", "productId");


--
-- Name: FavoriteItem_accountId_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX "FavoriteItem_accountId_idx" ON public."FavoriteItem" USING btree ("accountId");


--
-- Name: FavoriteItem_accountId_productId_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX "FavoriteItem_accountId_productId_key" ON public."FavoriteItem" USING btree ("accountId", "productId");


--
-- Name: ProductImage_productId_sortOrder_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX "ProductImage_productId_sortOrder_idx" ON public."ProductImage" USING btree ("productId", "sortOrder");


--
-- Name: Product_category_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX "Product_category_idx" ON public."Product" USING btree (category);


--
-- Name: Product_sellerId_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX "Product_sellerId_idx" ON public."Product" USING btree ("sellerId");


--
-- Name: Product_sku_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX "Product_sku_key" ON public."Product" USING btree (sku);


--
-- Name: Product_status_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX "Product_status_idx" ON public."Product" USING btree (status);


--
-- Name: Product_storeStatus_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX "Product_storeStatus_idx" ON public."Product" USING btree ("storeStatus");


--
-- Name: SellerLegalProfile_sellerId_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX "SellerLegalProfile_sellerId_key" ON public."SellerLegalProfile" USING btree ("sellerId");


--
-- Name: UserSeller_accountId_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX "UserSeller_accountId_key" ON public."UserSeller" USING btree ("accountId");


--
-- Name: User_accountId_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX "User_accountId_key" ON public."User" USING btree ("accountId");


--
-- Name: order_items_order_id_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);


--
-- Name: order_items_product_id_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX order_items_product_id_idx ON public.order_items USING btree (product_id);


--
-- Name: order_items_seller_id_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX order_items_seller_id_idx ON public.order_items USING btree (seller_id);


--
-- Name: order_payments_order_id_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX order_payments_order_id_idx ON public.order_payments USING btree (order_id);


--
-- Name: order_payments_provider_provider_payment_id_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX order_payments_provider_provider_payment_id_key ON public.order_payments USING btree (provider, provider_payment_id);


--
-- Name: order_payments_status_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX order_payments_status_idx ON public.order_payments USING btree (status);


--
-- Name: order_status_history_kind_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX order_status_history_kind_idx ON public.order_status_history USING btree (kind);


--
-- Name: order_status_history_order_id_created_at_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX order_status_history_order_id_created_at_idx ON public.order_status_history USING btree (order_id, created_at);


--
-- Name: orders_buyer_id_created_at_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX orders_buyer_id_created_at_idx ON public.orders USING btree (buyer_id, created_at);


--
-- Name: orders_fulfillment_status_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX orders_fulfillment_status_idx ON public.orders USING btree (fulfillment_status);


--
-- Name: orders_payment_status_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX orders_payment_status_idx ON public.orders USING btree (payment_status);


--
-- Name: orders_public_id_key; Type: INDEX; Schema: public; Owner: marketai
--

CREATE UNIQUE INDEX orders_public_id_key ON public.orders USING btree (public_id);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: marketai
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: AccountCredential AccountCredential_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."AccountCredential"
    ADD CONSTRAINT "AccountCredential_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SellerLegalProfile SellerLegalProfile_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."SellerLegalProfile"
    ADD CONSTRAINT "SellerLegalProfile_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."UserSeller"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSeller UserSeller_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."UserSeller"
    ADD CONSTRAINT "UserSeller_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_payments order_payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public.order_payments
    ADD CONSTRAINT order_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: marketai
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: marketai
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict FJtHemUBejYbZZMn9zn1itO8ytivZMgeThnrqRfJuLpXzK57pQN8sz3YmXpFLap

