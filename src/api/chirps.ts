import type { Request, Response } from "express";
import { profanityList } from "./profanityList.js";
import { BadRequestError } from "../errors/customErrors.js";
import { createChirp, getAllChirps } from "../db/queries/chirps.js";

export async function handlerCreateChirp(req: Request, res: Response) {
  const { body, userId } = req.body;
  
  if (typeof body !== "string") {
    throw new BadRequestError("Missing or invalid chirp body");
  }

  if (!userId) {
    throw new BadRequestError("User ID is required");
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
  const chirps = await getAllChirps();
  res.status(200).json(chirps);
}