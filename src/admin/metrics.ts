import fs from "fs/promises";
import { configAPI } from "../config.js";
import type { Request, Response } from "express";

export async function handlerMetrics(_: Request, res: Response) {
  try {
    let html = await fs.readFile("./src/admin/metrics.html", "utf-8");
    html = html.replace("NUM", String(configAPI.fileserverHits));
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    res.status(500).send("Error loading metrics page");
  }
}
