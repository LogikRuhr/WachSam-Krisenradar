CREATE TABLE "editorial_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_key" text NOT NULL,
	"alert_kind" text NOT NULL,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "editorial_alerts_alert_key_unique" ON "editorial_alerts" USING btree ("alert_key");