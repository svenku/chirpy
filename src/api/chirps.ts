import type { Request, Response } from "express";
import { profanityList } from "./profanityList.js";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import { createChirp, getAllChirps, getChirpById, deleteChirpById, getChirpsByAuthor } from "../db/queries/chirps.js";
import { getBearerToken, validateJWT } from "./auth.js";
import { configAPI } from "../config.js";

export async function handlerCreateChirp(req: Request, res: Response) {
  // Require authentication - extract user ID from JWT token
  const token = getBearerToken(req);
  const userId = validateJWT(token, configAPI.serverSecret);
  
  const { body } = req.body;
  
  if (typeof body !== "string") {
    throw new BadRequestError("Missing or invalid chirp body");
  }

  // Check chirp max length 140 characters
  if (body.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  // If valid, clean chirp body from profanities replace with **** (example)
  const profanities = profanityList;
  let cleanedBody = body;

  for (const profanity of profanities) {
    const regex = new RegExp(profanity, "gi");
    cleanedBody = cleanedBody.replace(regex, "****");
  }
  
  // Save chirp to database
  const newChirp = await createChirp({ body: cleanedBody, userId });
  
  res.status(201).json(newChirp);
}

export async function handlerGetAllChirps(req: Request, res: Response) {
  const { authorId } = req.query;
  
  let chirps;
  if (authorId) {
    // Filter chirps by author ID if provided
    if (typeof authorId !== 'string') {
      throw new BadRequestError("Author ID must be a string");
    }
    chirps = await getChirpsByAuthor(authorId);
  } else {
    // Return all chirps if no author filter
    chirps = await getAllChirps();
  }
  
  res.status(200).json(chirps);
}

export async function handlerGetChirpById(req: Request, res: Response) {
  const { chirpID } = req.params;
  
  if (!chirpID) {
    throw new BadRequestError("Chirp ID is required");
  }
  
  const chirp = await getChirpById(chirpID);
  
  if (!chirp) {
    throw new NotFoundError("Chirp not found");
  }
  
  res.status(200).json(chirp);
}

export async function handlerDeleteChirp(req: Request, res: Response) {
  // Check authentication
  let token: string;
  let userId: string;
  
  try {
    token = getBearerToken(req);
  } catch (error) {
    return res.status(401).json({ error: "Access token is required" });
  }
  
  try {
    userId = await validateJWT(token, configAPI.serverSecret);
  } catch (error) {
    return res.status(401).json({ error: "Invalid or malformed access token" });
  }
  
  const { chirpID } = req.params;
  
  if (!chirpID) {
    return res.status(400).json({ error: "Chirp ID is required" });
  }
  
  // Get the chirp to check if it exists and if user owns it
  const chirp = await getChirpById(chirpID);
  
  if (!chirp) {
    return res.status(404).json({ error: "Chirp not found" });
  }
  
  // Check if the user is the author of the chirp
  if (chirp.userId !== userId) {
    return res.status(403).json({ error: "You can only delete your own chirps" });
  }
  
  // Delete the chirp
  await deleteChirpById(chirpID);
  
  // Return 204 No Content for successful deletion
  res.status(204).send();
}