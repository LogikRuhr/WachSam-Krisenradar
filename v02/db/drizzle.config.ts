import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://wachsam:wachsam_dev@localhost:5432/wachsam",
  },
  verbose: true,
  strict: true,
});
