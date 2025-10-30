import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { refreshTokens, NewRefreshToken } from "../schema.js";

export async function createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const newRefreshToken: NewRefreshToken = {
        token,
        userId,
        expiresAt,
        revokedAt: null,
    };
    
    await db.insert(refreshTokens).values(newRefreshToken);
}

export async function getRefreshToken(token: string) {
    const result = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token))
        .limit(1);
    
    return result[0] || null;
}

export async function revokeRefreshToken(token: string): Promise<void> {
    const now = new Date();
    await db
        .update(refreshTokens)
        .set({ 
            revokedAt: now,
            updatedAt: now
        })
        .where(eq(refreshTokens.token, token));
}

export async function deleteExpiredRefreshTokens(): Promise<void> {
    await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.expiresAt, new Date()));
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.userId, userId));
}