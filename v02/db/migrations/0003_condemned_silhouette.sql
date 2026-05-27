CREATE TABLE "fact_refs" (
	"id" text PRIMARY KEY NOT NULL,
	"item_type" "item_source_type" NOT NULL,
	"item_id" text NOT NULL,
	"fact_id" text NOT NULL,
	"order_idx" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fact_refs" ADD CONSTRAINT "fact_refs_fact_id_facts_id_fk" FOREIGN KEY ("fact_id") REFERENCES "public"."facts"("id") ON DELETE cascade ON UPDATE no action;