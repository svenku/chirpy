import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../errors/customErrors.js';
import { getUserByEmail } from '../db/queries/users.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { configAPI } from '../config.js';

// Define the JWT payload type
type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function getBearerToken(req: Request): string {
    const authHeader = req.get('authorization');
    if (!authHeader) {
        throw new BadRequestError("Authorization header is missing");
    }
    const [, token] = authHeader.split(" ");
    return token;
}

export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    return await argon2.verify(hash, password);
}

export async function handlerLogin(req: Request, res: Response) {
    const { email, password, expiresInSeconds } = req.body;

    if (!email) {
        throw new BadRequestError("Email is required");
    }

    if (!password) {
        throw new BadRequestError("Password is required");
    }

    // Handle optional expiresInSeconds with validation
    const maxExpirationSeconds = 3600; // 1 hour in seconds
    const defaultExpirationSeconds = 3600; // 1 hour default
    
    let tokenExpirationSeconds: number;
    
    if (expiresInSeconds === undefined || expiresInSeconds === null) {
        // Not specified, use default
        tokenExpirationSeconds = defaultExpirationSeconds;
    } else if (typeof expiresInSeconds !== 'number' || expiresInSeconds <= 0) {
        // Invalid value, use default
        tokenExpirationSeconds = defaultExpirationSeconds;
    } else if (expiresInSeconds > maxExpirationSeconds) {
        // Over 1 hour, cap at 1 hour
        tokenExpirationSeconds = maxExpirationSeconds;
    } else {
        // Valid value within limits
        tokenExpirationSeconds = expiresInSeconds;
    }

    const user = await getUserByEmail(email);

    if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await checkPasswordHash(password, user.hashed_password);

    if (!isPasswordValid) {
        return res.status(401).json({ error: "Incorrect email or password" });
    }

        // Successful login - create JWT token
    const token = makeJWT(user.id, tokenExpirationSeconds, configAPI.serverSecret);
    
    const { hashed_password, ...userWithoutPassword } = user;
    res.status(200).json({
        ...userWithoutPassword,
        token
    });
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
