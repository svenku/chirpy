import express from "express";

import { handlerReadiness } from "./api/readiness.js";
import { resetCounter } from "./api/counter.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";
import { handlerMetrics } from "./admin/metrics.js";
import { handlerValidateChirp } from "./api/chirps.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { configAPI } from "./config.js";

const app = express();
const PORT = 8080;

import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

const migrationClient = postgres(configAPI.dbUrl, { max: 1 });
await migrate(drizzle(migrationClient), configAPI.migrationConfig);



// Register JSON body parser middleware
app.use(express.json());

// Register the middleware to log non-OK responses
app.use(middlewareLogResponses);

// Register the middleware to count server hits
app.use(middlewareMetricsInc);

app.use("/app", express.static("./src/app"));

app.get("/api/healthz", handlerReadiness);

// Remove /api/metrics route and add /admin/metrics route that serves HTML
app.get("/admin/metrics", handlerMetrics);

app.get("/admin/reset", resetCounter);

// Validate chirp endpoint with async error handling
app.post("/api/validate_chirp", asyncHandler(handlerValidateChirp));

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});