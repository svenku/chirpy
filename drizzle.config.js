import { defineConfig } from "drizzle-kit";
import { configAPI } from "./src/config.js";
export default defineConfig({
    schema: "src/db/schema.ts",
    out: "src/db/generated",
    dialect: "postgresql",
    dbCredentials: {
        url: configAPI.dbUrl,
    },
});
