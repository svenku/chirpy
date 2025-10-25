import express from "express";

import { handlerReadiness } from "./api/readiness.js";
import { resetCounter } from "./api/counter.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";
import { renderMetricsHtml } from "./admin/renderMetrics.js";

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
app.get("/admin/metrics", async (_req, res) => {
  await renderMetricsHtml(res);
});

app.get("/admin/reset", resetCounter);

// Validate chirp endpoint
app.post("/api/validate_chirp", (req, res) => {
  const { body } = req.body;
  if (typeof body !== "string") {
    return res.status(400).json({ error: "Missing or invalid chirp body" });
  }
  // Example: Chirp max length 140 characters
  if (body.length > 140) {
    return res.status(400).json({ error: "Chirp is too long" });
  }
  // If valid, clean chirp body from profanities replace with **** (example)
  const profanities = ["kerfuffle", "sharbert", "fornax"];
  let cleanedBody = body;

  for (const profanity of profanities) {
    const regex = new RegExp(profanity, "gi");
    cleanedBody = cleanedBody.replace(regex, "****");
  }
  
  res.status(200).json({ cleanedBody: cleanedBody });
});



app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});