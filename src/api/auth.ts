import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../errors/customErrors.js';
import { getUserByEmail } from '../db/queries/users.js';
import { createRefreshToken, getRefreshToken, revokeRefreshToken } from '../db/queries/refreshTokens.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { configAPI } from '../config.js';
import { randomBytes } from 'crypto';

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

    // Successful login - create JWT token (expires in 1 hour)
    const token = makeJWT(user.id, 3600, configAPI.serverSecret);
    
    // Create refresh token (expires in 60 days)
    const refreshToken = makeRefreshToken();
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 60); // 60 days from now
    
    await createRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);
    
    const { hashed_password, ...userWithoutPassword } = user;
    res.status(200).json({
        ...userWithoutPassword,
        token,
        refreshToken
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

export function makeRefreshToken(): string {
    const token = randomBytes(256).toString('hex');
    return token;
}

export async function handlerRefreshToken(req: Request, res: Response) {
    // Get refresh token from Authorization header
    const refreshToken = getBearerToken(req);

    // Get refresh token from database
    const storedToken = await getRefreshToken(refreshToken);

    if (!storedToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
        // Clean up expired token
        await revokeRefreshToken(refreshToken);
        return res.status(401).json({ error: "Refresh token has expired" });
    }

    // Check if token is revoked
    if (storedToken.revokedAt) {
        return res.status(401).json({ error: "Refresh token has been revoked" });
    }

    // Create new JWT token (expires in 1 hour)
    const newJwtToken = makeJWT(storedToken.userId, 3600, configAPI.serverSecret);

    res.status(200).json({
        token: newJwtToken
    });
}

export async function handlerRevokeToken(req: Request, res: Response) {
    // Get refresh token from Authorization header
    const refreshToken = getBearerToken(req);

    // Get refresh token from database
    const storedToken = await getRefreshToken(refreshToken);

    if (!storedToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Check if token is already revoked
    if (storedToken.revokedAt) {
        return res.status(401).json({ error: "Refresh token has already been revoked" });
    }

    // Revoke the refresh token
    await revokeRefreshToken(refreshToken);

    // Return 204 No Content
    res.status(204).send();
}

export async function getAPIKey(req: Request): Promise<string> {
    const authHeader = req.get('authorization');
    console.log("Authorization Header:", authHeader);
    if (!authHeader) {
        throw new BadRequestError("Authorization header is missing");
    }
    const [, apiKey] = authHeader.split("ApiKey ");
    return apiKey;
}
