import { describe, it, expect } from 'vitest';
import { handlerGetAllChirps } from '../api/chirps.js';

describe('handlerGetAllChirps with authorId parameter', () => {
    it('should handle request without authorId parameter', async () => {
        const mockReq = {
            query: {}
        } as any;

        let responseCode: number;
        let responseData: any;

        const mockRes = {
            status: (code: number) => ({
                json: (data: any) => {
                    responseCode = code;
                    responseData = data;
                    return { code, data };
                },
            }),
        } as any;

        await handlerGetAllChirps(mockReq, mockRes);

        expect(responseCode!).toBe(200);
        expect(Array.isArray(responseData)).toBe(true);
    });

    it('should handle request with valid authorId parameter', async () => {
        const testAuthorId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format
        const mockReq = {
            query: {
                authorId: testAuthorId
            }
        } as any;

        let responseCode: number;
        let responseData: any;

        const mockRes = {
            status: (code: number) => ({
                json: (data: any) => {
                    responseCode = code;
                    responseData = data;
                    return { code, data };
                },
            }),
        } as any;

        await handlerGetAllChirps(mockReq, mockRes);

        expect(responseCode!).toBe(200);
        expect(Array.isArray(responseData)).toBe(true);
    });

    it('should throw error for non-string authorId parameter', async () => {
        const mockReq = {
            query: {
                authorId: 123 // number instead of string
            }
        } as any;

        const mockRes = {} as any;

        try {
            await handlerGetAllChirps(mockReq, mockRes);
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).toContain('Author ID must be a string');
        }
    });

    it('should handle array of authorId values (Express query edge case)', async () => {
        const mockReq = {
            query: {
                authorId: ['id1', 'id2'] // Express can parse ?authorId=id1&authorId=id2 as array
            }
        } as any;

        const mockRes = {} as any;

        try {
            await handlerGetAllChirps(mockReq, mockRes);
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).toContain('Author ID must be a string');
        }
    });

    it('should handle empty string authorId', async () => {
        const mockReq = {
            query: {
                authorId: ''
            }
        } as any;

        let responseCode: number;
        let responseData: any;

        const mockRes = {
            status: (code: number) => ({
                json: (data: any) => {
                    responseCode = code;
                    responseData = data;
                    return { code, data };
                },
            }),
        } as any;

        // Empty string should be treated as a valid string (though it may return no results)
        await handlerGetAllChirps(mockReq, mockRes);

        expect(responseCode!).toBe(200);
        expect(Array.isArray(responseData)).toBe(true);
    });
});