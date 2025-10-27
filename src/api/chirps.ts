import type { Request, Response } from "express";
import { profanityList } from "./profanityList.js";
import { BadRequestError } from "../errors/customErrors.js";

export async function handlerValidateChirp(req: Request, res: Response) {
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
  
  res.status(200).json({ cleanedBody: cleanedBody });
}