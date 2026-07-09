UPDATE "households" SET "plz" = NULL WHERE "plz" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "households" ALTER COLUMN "plz" DROP NOT NULL;
