import type { Request, Response } from "express";
import { createUser } from "../db/queries/users.js";
import { BadRequestError } from "../errors/customErrors.js";
import { hashPassword } from "./auth.js";

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