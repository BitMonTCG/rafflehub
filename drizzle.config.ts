import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.sqlite.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "sqlite.db",
  },
  verbose: true,
  strict: true,
});
