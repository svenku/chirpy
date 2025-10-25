import express from "express";

import { handlerReadiness } from "./api/readiness.js";
import { handlerCounter, resetCounter } from "./api/counter.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";

const app = express();
const PORT = 8080;

// Register the middleware to log non-OK responses
app.use(middlewareLogResponses);

// Register the middleware to count server hits
app.use(middlewareMetricsInc);

app.use("/app", express.static("./src/app"));

app.get("/api/healthz", handlerReadiness);
app.get("/api/metrics", handlerCounter);
app.get("/api/reset", resetCounter);


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});