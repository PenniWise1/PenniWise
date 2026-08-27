import crypto from 'crypto';
import { config } from '../../config/env';
import { whatsappClient } from './whatsapp.client';
import { WA_TEMPLATES, type WaTemplateKey } from './whatsapp.templates';
import { UnauthorizedError, ValidationError } from '../../utils/appError';
import type {
  WhatsAppWebhookPayload,
  WhatsAppInboundMessage,
  WhatsAppButton,
  WhatsAppListSection,
} from './whatsapp.types';

export const verifyWebhookSubscription = (
  mode: string | undefined,
  token: string | undefined,
): boolean => {
  return mode === 'subscribe' && token === config.whatsapp.verifyToken;
};

export const verifySignature = (
  rawBody: Buffer | undefined,
  signatureHeader: string | undefined,
): void => {
  if (!rawBody) {
    throw new UnauthorizedError('Missing raw body for signature verification');
  }
  if (!signatureHeader?.startsWith('sha256=')) {
    throw new UnauthorizedError('Missing WhatsApp signature');
  }

  const expected = crypto
    .createHmac('sha256', config.whatsapp.appSecret)
    .update(rawBody)
    .digest('hex');
  const provided = signatureHeader.slice('sha256='.length);

  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(provided, 'hex');
  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    throw new UnauthorizedError('Invalid WhatsApp signature');
  }
};

export const parseInboundMessage = (
  payload: WhatsAppWebhookPayload,
): WhatsAppInboundMessage | null => {
  const value = payload.entry?.[0]?.changes?.[0]?.value;
  const raw = value?.messages?.[0];
  if (!raw) return null;

  const msg: WhatsAppInboundMessage = {
    from: raw['from'] as string,
    id: raw['id'] as string,
    timestamp: raw['timestamp'] as string,
    type: (raw['type'] as WhatsAppInboundMessage['type']) ?? 'unknown',
  };

  if (raw['text'])
    msg.text = raw['text'] as Exclude<
      WhatsAppInboundMessage['text'],
      undefined
    >;
  if (raw['interactive'])
    msg.interactive = raw['interactive'] as Exclude<
      WhatsAppInboundMessage['interactive'],
      undefined
    >;

  return msg;
};

export const sendTextMessage = async (to: string, body: string) => {
  return whatsappClient.sendText(to, body);
};

export const sendTemplateMessage = async (
  to: string,
  key: WaTemplateKey,
  components?: unknown[],
) => {
  const template = WA_TEMPLATES[key];
  return whatsappClient.sendTemplate(
    to,
    template.name,
    template.language,
    components,
  );
};

export const sendButtonMessage = (
  to: string,
  bodyText: string,
  buttons: WhatsAppButton[],
) => {
  if (buttons.length === 0 || buttons.length > 3) {
    throw new ValidationError(
      'WhatsApp button messages support 1-3 buttons only',
    );
  }
  return whatsappClient.sendButtons(to, bodyText, buttons);
};

export const sendListMessage = (
  to: string,
  bodyText: string,
  buttonLabel: string,
  sections: WhatsAppListSection[],
) => {
  const totalRows = sections.reduce((sum, s) => sum + s.rows.length, 0);
  if (totalRows === 0 || totalRows > 10) {
    throw new ValidationError(
      'WhatsApp list messages support 1-10 rows total across all sections',
    );
  }
  return whatsappClient.sendList(to, bodyText, buttonLabel, sections);
};

export const markMessageAsRead = (messageId: string) => {
  return whatsappClient.markAsRead(messageId);
};
