CREATE TABLE "indicator_observations" (
	"indicator_id" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"value" numeric NOT NULL,
	"source_stand" text,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "indicator_observations_indicator_id_observed_at_pk" PRIMARY KEY("indicator_id","observed_at")
);
--> statement-breakpoint
ALTER TABLE "indicator_observations" ADD CONSTRAINT "indicator_observations_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;