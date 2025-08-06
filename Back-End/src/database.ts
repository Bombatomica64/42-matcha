import { Pool } from "pg";
import { env } from "node:process";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});