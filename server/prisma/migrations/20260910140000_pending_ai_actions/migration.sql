-- Durable, user-owned confirmation records. Financial execution is deliberately
-- not coupled to this table; a future financial service consumes CONFIRMED rows.
CREATE TYPE "PendingAiActionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

CREATE TABLE "pending_ai_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "PendingAiActionStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pending_ai_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pending_ai_actions_user_id_status_idx" ON "pending_ai_actions"("user_id", "status");
CREATE INDEX "pending_ai_actions_expires_at_idx" ON "pending_ai_actions"("expires_at");
ALTER TABLE "pending_ai_actions" ADD CONSTRAINT "pending_ai_actions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
