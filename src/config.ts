process.loadEnvFile('.env');

type APIConfig = {
    fileserverHits: number;
    dbUrl: string;
};

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
    throw new Error('DB_URL environment variable is required');
}

export const configAPI: APIConfig = {
    fileserverHits: 0,
    dbUrl,
};