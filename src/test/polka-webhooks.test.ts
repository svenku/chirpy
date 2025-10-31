import { describe, it, expect } from 'vitest';
import { handlerPolkaWebhooks } from '../api/polka.js';

describe('Polka Webhooks', () => {
    it('should return 204 for non-user.upgraded events', async () => {
        const mockReq = {
            body: {
                event: "user.created",
                data: {
                    userId: "test-user-id"
                }
            }
        } as any;

        let responseCode: number;
        let sendCalled = false;

        const mockRes = {
            status: (code: number) => ({
                send: () => {
                    responseCode = code;
                    sendCalled = true;
                },
            }),
        } as any;

        await handlerPolkaWebhooks(mockReq, mockRes);

        expect(responseCode!).toBe(204);
        expect(sendCalled).toBe(true);
    });

    it('should handle invalid webhook payload', async () => {
        const mockReq = {
            body: {}
        } as any;

        const mockRes = {} as any;

        try {
            await handlerPolkaWebhooks(mockReq, mockRes);
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).toContain('Invalid webhook payload');
        }
    });

    it('should handle missing userId in user.upgraded event', async () => {
        const mockReq = {
            body: {
                event: "user.upgraded",
                data: {}
            }
        } as any;

        const mockRes = {} as any;

        try {
            await handlerPolkaWebhooks(mockReq, mockRes);
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).toContain('Missing userId');
        }
    });
});