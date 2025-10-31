import type { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import { upgradeUserToChirpyRed } from "../db/queries/users.js";
import { getAPIKey } from "./auth.js";
import { configAPI } from "../config.js";

export async function handlerPolkaWebhooks(req: Request, res: Response) {
    let apiKey: string;    
    try {
        apiKey = await getAPIKey(req);
    } catch (error) {
        return res.status(401).json({ error: "Invalid or missing API key" });
    }

    // Validate API key
    if (apiKey !== configAPI.polkaKey) {
        return res.status(401).json({ error: "Unauthorized: Invalid API key" });
    }
    
    const { event, data } = req.body;

    // Validate request structure
    if (!event || !data) {
        throw new BadRequestError("Invalid webhook payload");
    }

    // Only handle user.upgraded events
    if (event !== "user.upgraded") {
        return res.status(204).send();
    }

    // Validate userId in data
    if (!data.userId) {
        throw new BadRequestError("Missing userId in webhook data");
    }

    try {
        // Upgrade user to Chirpy Red
        const updatedUser = await upgradeUserToChirpyRed(data.userId);

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return 204 No Content for successful webhook processing
        res.status(204).send();
    } catch (error) {
        // If the error is related to user not found, return 404
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Re-throw other errors to be handled by error middleware
        throw error;
    }
}