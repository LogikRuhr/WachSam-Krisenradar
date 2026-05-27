ALTER TABLE "indicators" ADD COLUMN "baseline_value" numeric;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "baseline_period" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "baseline_source_name" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "baseline_source_url" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "crisis_reference_value" numeric;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "crisis_reference_period" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "crisis_reference_source_name" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "crisis_reference_source_url" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "recent_reference_value" numeric;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "recent_reference_period" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "recent_reference_source_name" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "recent_reference_source_url" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "threshold_method" text;