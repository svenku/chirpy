process.loadEnvFile('.env');
import type { MigrationConfig } from "drizzle-orm/migrator";

type APIConfig = {
    fileserverHits: number;
    dbUrl: string;
    migrationConfig: MigrationConfig;
    platform: string;
    serverSecret: string;
};

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
    throw new Error('DB_URL environment variable is required');
}

const platform = process.env.PLATFORM || 'dev';

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/generated",
};

const serverSecret = process.env.SECRET;
if (!serverSecret) {
    throw new Error('SECRET environment variable is required');
}

export const configAPI: APIConfig = {
    fileserverHits: 0,
    dbUrl,
    migrationConfig,
    platform,
    serverSecret,
};



