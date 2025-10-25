import {configAPI} from '../config.js';
import type { Request, Response } from "express";

// export async function handlerCounter(_: Request, res: Response) {
//   res.send(`Hits: ${configAPI.fileserverHits}`);
// };

export async function resetCounter(_: Request, res: Response) {
  configAPI.fileserverHits = 0;
  res.send();
};