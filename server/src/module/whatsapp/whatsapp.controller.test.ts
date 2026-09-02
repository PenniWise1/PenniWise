import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { whatsappRouter } from './whatsapp.routes';
import AppError from '../../utils/appError';

// Mock config so the service doesn't throw mustGet errors if envs are missing
vi.mock('../../config/env', () => ({
  config: {
    whatsapp: {
      verifyToken: 'test-verify-token',
      appSecret: 'test-app-secret',
    },
  },
}));

// Mock the flow manager to test message passing
vi.mock('../conversation/conversation.flow-manager', () => ({
  handleInboundMessage: vi.fn().mockResolvedValue(undefined),
}));

// Setup Express app exactly like how it is mounted in app.ts
const app = express();
app.use('/api/whatsapp', whatsappRouter);

// A simple error handler to catch AppError and return its status code
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
  } else {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

describe('WhatsApp Webhook Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/whatsapp/webhook (Verification)', () => {
    it('should return 403 if mode or token are wrong', async () => {
      const res = await request(app).get('/api/whatsapp/webhook').query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong-token',
        'hub.challenge': '12345',
      });

      expect(res.status).toBe(403);
    });

    it('should return 200 and challenge if mode and token are correct', async () => {
      const res = await request(app).get('/api/whatsapp/webhook').query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test-verify-token',
        'hub.challenge': '12345',
      });

      expect(res.status).toBe(200);
      expect(res.text).toBe('12345');
    });
  });

  describe('POST /api/whatsapp/webhook (Receiving messages)', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '123',
                  phone_number_id: '123',
                },
                messages: [
                  {
                    from: '1234567890',
                    id: 'wamid.123',
                    timestamp: '1600000000',
                    type: 'text',
                    text: { body: 'Hello world' },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    it('should return 401 if signature is missing or invalid', async () => {
      const bodyString = JSON.stringify(payload);
      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .set('Content-Type', 'application/json')
        .send(bodyString);

      expect(res.status).toBe(401);
    });

    it('should process message and echo back if signature is valid', async () => {
      const bodyString = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', 'test-app-secret')
        .update(bodyString)
        .digest('hex');

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .set('x-hub-signature-256', `sha256=${signature}`)
        .set('Content-Type', 'application/json')
        .send(bodyString);

      expect(res.status).toBe(200);

      // Verify that the handleInboundMessage method was called
      const { handleInboundMessage } =
        await import('../conversation/conversation.flow-manager');
      expect(handleInboundMessage).toHaveBeenCalledWith({
        from: '1234567890',
        id: 'wamid.123',
        timestamp: '1600000000',
        type: 'text',
        text: { body: 'Hello world' },
      });
    });
  });
});
