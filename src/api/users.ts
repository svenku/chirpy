import type { Request, Response } from "express";
import { createUser } from "../db/queries/users.js";
import { BadRequestError } from "../errors/customErrors.js";

export async function handlerCreateUser(req: Request, res: Response) {
    const { email } = req.body;
    
    if (!email) {
        throw new BadRequestError("Email is required");
    }
    
    const newUser = await createUser({ email });
    
    if (!newUser) {
        // User already exists (conflict occurred)
        return res.status(409).json({ error: "User with this email already exists" });
    }
    
    res.status(201).json(newUser);
}