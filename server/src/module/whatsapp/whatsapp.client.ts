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
    const errorBody = await res.text();
    logger.error(`WhatsApp API error (${res.status}): ${errorBody}`);
    throw new Error(`WhatsApp API error (${res.status}): ${errorBody}`);
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
