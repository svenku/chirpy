import express from "express";

import { handlerReadiness } from "./api/readiness.js";
import { resetCounter } from "./api/counter.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";
import { handlerMetrics } from "./admin/metrics.js";
import { handlerValidateChirp } from "./api/chirps.js";

const app = express();
const PORT = 8080;

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

// Validate chirp endpoint
app.post("/api/validate_chirp", handlerValidateChirp);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});