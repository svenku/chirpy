import type { Request, Response } from "express";
import type { NewUser } from "../db/schema.js";
import { createUser, updateUser } from "../db/queries/users.js";
import { BadRequestError, UnauthorizedError } from "../errors/customErrors.js";
import { hashPassword, getBearerToken, validateJWT } from "./auth.js";
import { configAPI } from "../config.js";


export async function handlerCreateUser(req: Request, res: Response) {
    const { email, password } = req.body;
    
    if (!email) {
        throw new BadRequestError("Email is required");
    }

    if (!password) {
        throw new BadRequestError("Password is required");
    }

    const hashed_pw = await hashPassword(password);

    console.log("Hashed password:", hashed_pw);

    const newUser = await createUser({ email, hashed_password: hashed_pw });

    if (!newUser) {
        // User already exists (conflict occurred)
        return res.status(409).json({ error: "User with this email already exists" });
    }
    // create a copy of newUser without the hashed_password field
    const { hashed_password, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
}
export async function handlerUpdateUser(req: Request, res: Response) {
    // Get and validate JWT token first
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
        throw new UnauthorizedError("Invalid or malformed access token");
    }
    
    const { email, password } = req.body;

    if (!email && !password) {
        throw new BadRequestError("At least one of email or password must be provided");
    }

    // Build updates object with correct property names
    const updates: Partial<NewUser> = {};
    
    if (email) {
        updates.email = email;
    }
    
    if (password) {
        updates.hashed_password = await hashPassword(password);
    }

    const updatedUser = await updateUser(userId, updates);

    if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
    }

    const { hashed_password, ...userWithoutPassword } = updatedUser;

    res.status(200).json(userWithoutPassword);
}

