import { config } from '../../config/env';
import logger from '../../config/logger';
import type { WhatsAppButton, WhatsAppListSection } from './whatsapp.types';

const BASE_URL = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`;

async function post(
  body: Record<string, unknown>,
): Promise<{ messages: Array<{ id: string }> }> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
  });

  if (!res.ok) {
    // Provider payloads can contain user content or identifiers; do not log or
    // return them to callers.
    logger.error('WhatsApp API request failed', { status: res.status });
    throw new Error(`WhatsApp API request failed with status ${res.status}`);
  }
  return (await res.json()) as { messages: Array<{ id: string }> };
}

export const whatsappClient = {
  sendText(to: string, body: string) {
    return post({ to, type: 'text', text: { body } });
  },

  sendTemplate(
    to: string,
    name: string,
    language: string,
    components?: unknown[],
  ) {
    return post({
      to,
      type: 'template',
      template: { name, language: { code: language }, components },
    });
  },

  sendButtons(to: string, bodyText: string, buttons: WhatsAppButton[]) {
    return post({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    });
  },

  sendList(
    to: string,
    bodyText: string,
    buttonLabel: string,
    sections: WhatsAppListSection[],
  ) {
    return post({
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: { button: buttonLabel, sections },
      },
    });
  },

  markAsRead(messageId: string) {
    return post({ status: 'read', message_id: messageId });
  },
};
