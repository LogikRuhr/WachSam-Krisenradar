CREATE TYPE "public"."confidence" AS ENUM('niedrig', 'mittel', 'hoch');--> statement-breakpoint
CREATE TYPE "public"."household_modus" AS ENUM('single', 'familie', 'selbststaendig', 'rentner');--> statement-breakpoint
CREATE TYPE "public"."item_source_type" AS ENUM('lagebild', 'cost', 'supply', 'cascade', 'governance', 'indicator', 'action');--> statement-breakpoint
CREATE TYPE "public"."methodology_tag" AS ENUM('steep', 'rca', 'bia', 'fmea', 'scenario');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('stabil', 'beobachten', 'erhoeht', 'kritisch', 'eskalierend');--> statement-breakpoint
CREATE TYPE "public"."zeithorizont" AS ENUM('kurzfristig', 'wochen', 'monate', 'langfristig');--> statement-breakpoint
CREATE TABLE "cascades" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"trigger" text NOT NULL,
	"confidence" "confidence" NOT NULL,
	"severity" "severity" NOT NULL,
	"zeithorizont" "zeithorizont" NOT NULL,
	"methodology_tag" "methodology_tag" NOT NULL,
	"germany_relevance" jsonb NOT NULL,
	"steps" jsonb NOT NULL,
	"haushaltswirkung" text NOT NULL,
	"retrieved_at" timestamp with time zone,
	"editorial_reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_impacts" (
	"id" text PRIMARY KEY NOT NULL,
	"bereich" text NOT NULL,
	"titel" text NOT NULL,
	"beschreibung" text NOT NULL,
	"zeithorizont" "zeithorizont" NOT NULL,
	"confidence" "confidence" NOT NULL,
	"unsicherheit" text NOT NULL,
	"causal_links" jsonb NOT NULL,
	"retrieved_at" timestamp with time zone,
	"editorial_reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facts" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"value_label" text NOT NULL,
	"value_numeric" numeric,
	"unit" text,
	"period" text,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"source_stand" text NOT NULL,
	"retrieved_at" timestamp with time zone,
	"editorial_reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"versprechen" text NOT NULL,
	"realitaet" text NOT NULL,
	"haushaltswirkung" text NOT NULL,
	"confidence" "confidence" NOT NULL,
	"linked_cascade" text,
	"retrieved_at" timestamp with time zone,
	"editorial_reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"modus" "household_modus" NOT NULL,
	"plz" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indicators" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"threshold_warn" numeric,
	"threshold_critical" numeric,
	"unit" text,
	"system" text NOT NULL,
	"severity_trigger" "severity" NOT NULL,
	"quelle" text NOT NULL,
	"germany_relevance" jsonb NOT NULL,
	"linked_cascade" text,
	"retrieved_at" timestamp with time zone,
	"editorial_reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"item_type" "item_source_type" NOT NULL,
	"item_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"source_stand" text NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lagebild_items" (
	"id" text PRIMARY KEY NOT NULL,
	"bereich" text NOT NULL,
	"titel" text NOT NULL,
	"beschreibung" text NOT NULL,
	"severity" "severity" NOT NULL,
	"trend" text NOT NULL,
	"primaerindikator" text NOT NULL,
	"confidence" "confidence" NOT NULL,
	"fact_ids" jsonb NOT NULL,
	"retrieved_at" timestamp with time zone,
	"editorial_reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supply_risks" (
	"id" text PRIMARY KEY NOT NULL,
	"bereich" text NOT NULL,
	"titel" text NOT NULL,
	"beschreibung" text NOT NULL,
	"severity" "severity" NOT NULL,
	"zeithorizont" "zeithorizont" NOT NULL,
	"confidence" "confidence" NOT NULL,
	"retrieved_at" timestamp with time zone,
	"editorial_reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"name" text,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "governance" ADD CONSTRAINT "governance_linked_cascade_cascades_id_fk" FOREIGN KEY ("linked_cascade") REFERENCES "public"."cascades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_linked_cascade_cascades_id_fk" FOREIGN KEY ("linked_cascade") REFERENCES "public"."cascades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");