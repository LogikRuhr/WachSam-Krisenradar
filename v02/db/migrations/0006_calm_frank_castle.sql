ALTER TYPE "public"."editorial_action" ADD VALUE 'ingest_value';--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "current_value" numeric;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "current_value_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "previous_value" numeric;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "previous_value_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "last_ingested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "scale_direction" text DEFAULT 'higher_is_worse' NOT NULL;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "zone_text_uncritical" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "zone_text_elevated" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "zone_text_critical" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "target_value" numeric;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "target_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "target_label" text;