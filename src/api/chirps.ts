import type { Request, Response } from "express";
import { profanityList } from "./profanityList";

export async function handlerValidateChirp(req: Request, res: Response) {
  
  const { body } = req.body;
  
  if (typeof body !== "string") {
    return res.status(400).json({ error: "Missing or invalid chirp body" });
  }

  // Check chirp max length 140 characters
  if (body.length > 140) {
    return res.status(400).json({ error: "Chirp is too long" });
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