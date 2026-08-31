import { Router, json } from 'express';
import { verifyHandler, receiveHandler } from './whatsapp.controller';

export const whatsappRouter: ReturnType<typeof Router> = Router();

const captureRawBody = json({
  verify: (req, _res, buf) => {
    (req as unknown as { rawBody?: Buffer }).rawBody = buf;
  },
});

whatsappRouter.get('/webhook', verifyHandler);
whatsappRouter.post('/webhook', captureRawBody, receiveHandler);
