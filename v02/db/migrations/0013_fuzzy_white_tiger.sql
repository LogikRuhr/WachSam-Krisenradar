CREATE TABLE "regional_warnings" (
	"region_code" text NOT NULL,
	"source" text DEFAULT 'dwd' NOT NULL,
	"warning_count" integer NOT NULL,
	"max_level" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regional_warnings_region_code_source_pk" PRIMARY KEY("region_code","source")
);
