CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"session_id" text,
	"path" text,
	"product_id" integer,
	"value" double precision,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"items" text NOT NULL,
	"subtotal" double precision NOT NULL,
	"shipping" double precision NOT NULL,
	"tax" double precision NOT NULL,
	"total" double precision NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"created_at" bigint NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "processed_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"species" text,
	"apparel_category" text,
	"brand" text NOT NULL,
	"price" double precision NOT NULL,
	"compare_at_price" double precision,
	"short_description" text NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"sizes" text,
	"colors" text,
	"tags" text,
	"rating" double precision DEFAULT 4.7 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"is_dropship" boolean DEFAULT false NOT NULL,
	"bestseller" boolean DEFAULT false NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
