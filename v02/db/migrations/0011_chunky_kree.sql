CREATE TYPE "public"."cascade_indicator_role" AS ENUM('driver', 'affected');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('fakt', 'schaetzung', 'annahme', 'bewertung');--> statement-breakpoint
CREATE TABLE "cascade_indicator_links" (
	"id" text PRIMARY KEY NOT NULL,
	"cascade_id" text NOT NULL,
	"indicator_id" text NOT NULL,
	"role" "cascade_indicator_role" NOT NULL,
	"relation" text,
	"lag_hint" text,
	"revision_criteria" jsonb,
	"retrieved_at" timestamp with time zone,
	"editorial_status" "editorial_status" DEFAULT 'published' NOT NULL,
	"editorial_reviewed_at" timestamp with time zone,
	"editorial_reviewed_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "national_state" (
	"id" text PRIMARY KEY NOT NULL,
	"stand_date" timestamp with time zone NOT NULL,
	"overall_tone" "severity" NOT NULL,
	"executive_summary" text NOT NULL,
	"revision_criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gegentrends" jsonb,
	"retrieved_at" timestamp with time zone,
	"editorial_status" "editorial_status" DEFAULT 'published' NOT NULL,
	"editorial_reviewed_at" timestamp with time zone,
	"editorial_reviewed_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "facts" ADD COLUMN "evidence_type" "evidence_type";--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "headline_tier" integer;--> statement-breakpoint
ALTER TABLE "lagebild_items" ADD COLUMN "evidence_type" "evidence_type";--> statement-breakpoint
ALTER TABLE "cascade_indicator_links" ADD CONSTRAINT "cascade_indicator_links_cascade_id_cascades_id_fk" FOREIGN KEY ("cascade_id") REFERENCES "public"."cascades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cascade_indicator_links" ADD CONSTRAINT "cascade_indicator_links_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cascade_indicator_links_unique" ON "cascade_indicator_links" USING btree ("cascade_id","indicator_id","role");