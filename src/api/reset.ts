import {configAPI} from '../config.js';
import type { Request, Response } from "express";
import { deleteAllUsers } from '../db/queries/users.js';

export async function resetAll(_: Request, res: Response) {
  if (configAPI.platform !== "dev") {
    return res.status(403).json({ error: "Resetting is only allowed in dev environment" });
  }
  configAPI.fileserverHits = 0;
  // resetAll should also delete all users from the database users table
  await deleteAllUsers();
  res.send();
};