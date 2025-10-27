import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";
import { configAPI } from "../config.js";

const conn = postgres(configAPI.dbUrl);
export const db = drizzle(conn, { schema });