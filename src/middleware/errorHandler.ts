import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/customErrors.js";

// Error handling middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
  } else {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}