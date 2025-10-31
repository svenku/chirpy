import { describe, it, expect } from 'vitest';
import { getAPIKey } from '../api/auth.js';

describe('getAPIKey', () => {
    it('should correctly extract API key from valid Authorization header', async () => {
        const mockReq = {
            get: (header: string) => {
                if (header === 'authorization') {
                    return 'Authorization: ApiKey my-secret-api-key-123';
                }
                return null;
            },
        } as any;

        const result = await getAPIKey(mockReq);
        expect(result).toBe('my-secret-api-key-123');
    });

    it('should handle API key with special characters', async () => {
        const mockReq = {
            get: (header: string) => {
                if (header === 'authorization') {
                    return 'Authorization: ApiKey abc-123_XYZ!@#$%';
                }
                return null;
            },
        } as any;

        const result = await getAPIKey(mockReq);
        expect(result).toBe('abc-123_XYZ!@#$%');
    });

    it('should handle long API keys', async () => {
        const longKey = 'a'.repeat(100);
        const mockReq = {
            get: (header: string) => {
                if (header === 'authorization') {
                    return `Authorization: ApiKey ${longKey}`;
                }
                return null;
            },
        } as any;

        const result = await getAPIKey(mockReq);
        expect(result).toBe(longKey);
    });

    it('should throw error when Authorization header is missing', async () => {
        const mockReq = {
            get: (header: string) => null,
        } as any;

        await expect(getAPIKey(mockReq)).rejects.toThrow('Authorization header is missing');
    });

    it('should throw error when Authorization header is empty string', async () => {
        const mockReq = {
            get: (header: string) => {
                if (header === 'authorization') {
                    return '';
                }
                return null;
            },
        } as any;

        await expect(getAPIKey(mockReq)).rejects.toThrow('Authorization header is missing');
    });

    it('should handle malformed Authorization header (missing ApiKey prefix)', async () => {
        const mockReq = {
            get: (header: string) => {
                if (header === 'authorization') {
                    return 'Authorization: Bearer my-token-123';
                }
                return null;
            },
        } as any;

        const result = await getAPIKey(mockReq);
        // With current implementation, this would return undefined
        // because split(" ApiKey ") won't find the delimiter
        expect(result).toBeUndefined();
    });

    it('should handle Authorization header with only "ApiKey" (no actual key)', async () => {
        const mockReq = {
            get: (header: string) => {
                if (header === 'authorization') {
                    return 'Authorization: ApiKey ';
                }
                return null;
            },
        } as any;

        const result = await getAPIKey(mockReq);
        // This would return empty string with current implementation
        expect(result).toBe('');
    });

    it('should handle case sensitivity correctly', async () => {
        // Test that "ApiKey" is case-sensitive
        const mockReq = {
            get: (header: string) => {
                if (header === 'authorization') {
                    return 'Authorization: apikey my-secret-key';
                }
                return null;
            },
        } as any;

        const result = await getAPIKey(mockReq);
        // With current implementation, this would return undefined
        // because "apikey" != "ApiKey"
        expect(result).toBeUndefined();
    });

    it('should handle multiple ApiKey occurrences (edge case)', async () => {
        const mockReq = {
            get: (header: string) => {
                if (header === 'authorization') {
                    return 'Authorization: ApiKey first-key ApiKey second-key';
                }
                return null;
            },
        } as any;

        const result = await getAPIKey(mockReq);
        // With current split implementation, this actually returns "first-key"
        // because split(" ApiKey ") creates ["Authorization:", "first-key", "second-key"]
        // and we take index [1] which is "first-key"
        expect(result).toBe('first-key');
    });
});