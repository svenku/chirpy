import type { Request, Response, NextFunction } from "express";
import { configAPI } from '../config.js';

// Middleware to log requests with non-OK status codes

export async function middlewareLogResponses(req: Request, res: Response, next: NextFunction) {
  // Listen for the response to finish
  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.log(`[NON-OK][${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    }
  });
  next();
}

// Middleware to count server hits

export async function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  // Increment the fileserverHits for all requests except /metrics
  if (req.path !== "/metrics") {
    configAPI.fileserverHits += 1;
  }
  next();
}

