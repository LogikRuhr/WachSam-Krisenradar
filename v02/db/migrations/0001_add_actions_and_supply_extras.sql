CREATE TYPE "public"."aufwand" AS ENUM('niedrig', 'mittel', 'hoch');--> statement-breakpoint
CREATE TABLE "citizen_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"bereich" text NOT NULL,
	"titel" text NOT NULL,
	"beschreibung" text NOT NULL,
	"aufwand" "aufwand" NOT NULL,
	"bezug_zu_bereich" jsonb NOT NULL,
	"causal_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"retrieved_at" timestamp with time zone,
	"editorial_reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seed_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supply_risks" ADD COLUMN "unsicherheit" text;--> statement-breakpoint
ALTER TABLE "supply_risks" ADD COLUMN "causal_links" jsonb DEFAULT '[]'::jsonb NOT NULL;