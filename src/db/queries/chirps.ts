import { db } from "../index.js";
import { NewChirp, chirps } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .returning();
  return result;
};

export async function getAllChirps() {
  const results = await db
    .select()
    .from(chirps)
    .orderBy(chirps.createdAt);
  return results;
};

export async function getChirpById(id: string) {
  const [result] = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, id));
  return result;
};

export async function deleteChirpById(id: string) {
  const [result] = await db
    .delete(chirps)
    .where(eq(chirps.id, id))
    .returning();
  return result;
};