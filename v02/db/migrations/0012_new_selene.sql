CREATE TYPE "public"."feedback_category" AS ENUM('lob', 'problem', 'idee', 'datenfehler', 'sonstiges');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"category" "feedback_category" DEFAULT 'sonstiges' NOT NULL,
	"message" text NOT NULL,
	"page_path" text,
	"rating" integer,
	"contact_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;