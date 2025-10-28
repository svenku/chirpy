process.loadEnvFile('.env');
import type { MigrationConfig } from "drizzle-orm/migrator";

type APIConfig = {
    fileserverHits: number;
    dbUrl: string;
    migrationConfig: MigrationConfig;
};

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
    throw new Error('DB_URL environment variable is required');
}

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/generated",
};

export const configAPI: APIConfig = {
    fileserverHits: 0,
    dbUrl,
    migrationConfig,
};



