-- Meta may retry a webhook. A non-null WhatsApp message ID must be processed once.
CREATE UNIQUE INDEX "conversation_messages_whatsapp_message_id_key"
ON "conversation_messages"("whatsapp_message_id");
