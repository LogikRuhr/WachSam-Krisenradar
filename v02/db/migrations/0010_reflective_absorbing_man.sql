CREATE TYPE "public"."source_health_status" AS ENUM('fresh', 'stale', 'error', 'disabled', 'unknown', 'anomaly');--> statement-breakpoint
CREATE TABLE "source_health" (
	"source_id" text PRIMARY KEY NOT NULL,
	"source_name" text NOT NULL,
	"target" text NOT NULL,
	"status" "source_health_status" DEFAULT 'unknown' NOT NULL,
	"last_checked_at" timestamp with time zone NOT NULL,
	"last_success_at" timestamp with time zone,
	"item_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"error_messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
