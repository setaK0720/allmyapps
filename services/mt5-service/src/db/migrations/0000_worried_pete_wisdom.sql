CREATE TABLE "positions" (
	"ticket" bigint PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"strategy_id" integer,
	"order_type" varchar(10) NOT NULL,
	"lot" numeric(10, 2) NOT NULL,
	"open_price" numeric(20, 5) NOT NULL,
	"current_price" numeric(20, 5) NOT NULL,
	"unrealized_pl" numeric(10, 2) NOT NULL,
	"open_time" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"max_lot_per_trade" numeric(10, 2) DEFAULT '0.01' NOT NULL,
	"daily_loss_limit" numeric(10, 2) DEFAULT '100.00' NOT NULL,
	"max_open_positions" integer DEFAULT 3 NOT NULL,
	"emergency_stop" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"timeframe" varchar(10) NOT NULL,
	"strategy_type" varchar(50) NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket" bigint NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"strategy_id" integer,
	"order_type" varchar(10) NOT NULL,
	"lot" numeric(10, 2) NOT NULL,
	"open_price" numeric(20, 5) NOT NULL,
	"close_price" numeric(20, 5),
	"open_time" timestamp with time zone NOT NULL,
	"close_time" timestamp with time zone,
	"profit" numeric(10, 2),
	"swap" numeric(10, 2),
	"commission" numeric(10, 2),
	"status" varchar(10) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trades_ticket_unique" UNIQUE("ticket")
);
--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_strategy_id_strategy_configs_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategy_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_strategy_id_strategy_configs_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategy_configs"("id") ON DELETE no action ON UPDATE no action;