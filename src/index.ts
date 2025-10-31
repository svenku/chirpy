import express from "express";

import { handlerReadiness } from "./api/readiness.js";
import { resetAll } from "./api/reset.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";
import { handlerMetrics } from "./admin/metrics.js";
import { handlerCreateChirp } from "./api/chirps.js";
import { handlerGetAllChirps } from "./api/chirps.js";
import { handlerGetChirpById, handlerDeleteChirp } from "./api/chirps.js";
import { handlerCreateUser, handlerUpdateUser } from "./api/users.js";
import { handlerLogin, handlerRefreshToken, handlerRevokeToken } from "./api/auth.js";
import { handlerPolkaWebhooks } from "./api/polka.js";
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

app.post("/admin/reset", asyncHandler(resetAll));

// Create user endpoint
app.post("/api/users", asyncHandler(handlerCreateUser));
app.put("/api/users", asyncHandler(handlerUpdateUser));

// Create login endpoint
app.post("/api/login", asyncHandler(handlerLogin));

// Refresh token endpoint
app.post("/api/refresh", asyncHandler(handlerRefreshToken));

// Revoke token endpoint
app.post("/api/revoke", asyncHandler(handlerRevokeToken));

// Create chirp endpoint
app.post("/api/chirps", asyncHandler(handlerCreateChirp));

// get chirps endpoint
app.get("/api/chirps", asyncHandler(handlerGetAllChirps));

// get single chirp by ID endpoint
app.get("/api/chirps/:chirpID", asyncHandler(handlerGetChirpById));

// delete chirp by ID endpoint
app.delete("/api/chirps/:chirpID", asyncHandler(handlerDeleteChirp));

// Upgrade user to Chirpy Red
app.post("/api/polka/webhooks", asyncHandler(handlerPolkaWebhooks));

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

