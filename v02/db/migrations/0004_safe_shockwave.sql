CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"source_stand" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sources_source_url_unique" ON "sources" USING btree ("source_url");