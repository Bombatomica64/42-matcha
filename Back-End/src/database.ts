import { env } from "node:process";
import { Pool } from "pg";

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
});
