CREATE TYPE "public"."editorial_action" AS ENUM('create', 'update', 'approve', 'reject', 'publish', 'unpublish');--> statement-breakpoint
CREATE TYPE "public"."editorial_status" AS ENUM('draft', 'approved', 'rejected', 'published');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('viewer', 'editor', 'admin');--> statement-breakpoint
CREATE TABLE "editorial_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"action" "editorial_action" NOT NULL,
	"actor_id" text,
	"from_status" "editorial_status",
	"to_status" "editorial_status",
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cascades" ADD COLUMN "editorial_status" "editorial_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "cascades" ADD COLUMN "editorial_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "citizen_actions" ADD COLUMN "editorial_status" "editorial_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "citizen_actions" ADD COLUMN "editorial_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "cost_impacts" ADD COLUMN "editorial_status" "editorial_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "cost_impacts" ADD COLUMN "editorial_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "facts" ADD COLUMN "editorial_status" "editorial_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "facts" ADD COLUMN "editorial_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "governance" ADD COLUMN "editorial_status" "editorial_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "governance" ADD COLUMN "editorial_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "editorial_status" "editorial_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "editorial_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "lagebild_items" ADD COLUMN "editorial_status" "editorial_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "lagebild_items" ADD COLUMN "editorial_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "supply_risks" ADD COLUMN "editorial_status" "editorial_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "supply_risks" ADD COLUMN "editorial_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'viewer' NOT NULL;--> statement-breakpoint
ALTER TABLE "editorial_audit_log" ADD CONSTRAINT "editorial_audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;