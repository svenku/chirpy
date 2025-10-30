import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../errors/customErrors.js';
import { getUserByEmail } from '../db/queries/users.js';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Define the JWT payload type
type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;


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



export function makeJWT(userID: string, expiresIn: number, secret: string): string {
    const currentTime = Math.floor(Date.now() / 1000);
    
    const jwtPayload: payload = {
        iss: "chirpy",              // issuer
        sub: userID,                // subject (user's ID)
        iat: currentTime,           // issued at time
        exp: currentTime + expiresIn // expiration time
    };
    
    const token = jwt.sign(jwtPayload, secret);
    return token;
}

export function validateJWT(tokenString: string, secret: string): string {
    try {
        const decoded = jwt.verify(tokenString, secret) as payload;
        
        if (!decoded.sub) {
            throw new UnauthorizedError("Invalid token: missing user ID");
        }
        
        return decoded.sub;
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError("Invalid token");
        } else if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError("Token has expired");
        } else {
            throw new UnauthorizedError("Token validation failed");
        }
    }
}
