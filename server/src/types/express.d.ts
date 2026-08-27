import type { AccessTokenPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      admin?: AccessTokenPayload;
      rawBody?: Buffer;
    }
  }
}

export {};
