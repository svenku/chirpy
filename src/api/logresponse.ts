import type { Request, Response, NextFunction } from "express";

// Middleware to log requests with non-OK status codes

export function middlewareLogResponses(req: Request, res: Response, next: NextFunction) {
  // Listen for the response to finish
  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.log(`[NON-OK][${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    }
  });
  next();
}

