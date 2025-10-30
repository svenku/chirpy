import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { BadRequestError } from '../errors/customErrors.js';
import { getUserByEmail } from '../db/queries/users.js';

export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    return await argon2.verify(hash, password);
}

export async function handlerLogin(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email) {
        throw new BadRequestError("Email is required");
    }

    if (!password) {
        throw new BadRequestError("Password is required");
    }

    const user = await getUserByEmail(email);

    if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await checkPasswordHash(password, user.hashed_password);

    if (!isPasswordValid) {
        return res.status(401).json({ error: "Incorrect email or password" });
    }

    // Successful login
    const { hashed_password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
} 