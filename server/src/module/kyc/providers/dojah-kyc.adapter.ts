import { config } from '../../../config/env';
import type { KycProviderAdapter, KycProviderResult } from '../kyc.types';

// Verified against Dojah's current public docs (docs.dojah.io) at the time
// this was written — GET /api/v1/kyc/bvn and /api/v1/kyc/nin, both taking
// the value as a query param, both authenticated with AppId + Authorization
// headers where Authorization is the RAW secret key (no "Bearer " prefix —
// this trips people up coming from most other APIs). Re-check against
// Dojah's docs before relying on this in anything beyond a scaffold; API
// details can change and this hasn't been run against a live account.
const BASE_URL = config.kyc.dojah.baseUrl;

async function dojahGet(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}${path}?${query}`, {
    headers: {
      AppId: config.kyc.dojah.appId,
      Authorization: config.kyc.dojah.secretKey, // NOT "Bearer <key>" — Dojah wants the raw key
    },
  });

  if (!res.ok) {
    throw new Error(`Dojah API error (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// Dojah's raw response includes the BVN/NIN itself and other PII in
// `entity` — this strips identifying fields before anything gets passed to
// kyc.service.ts for storage, since KycVerification.metadata must never
// contain the raw number, even coming back from the provider's own response.
function redactSensitive(
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const { bvn: _bvn, nin: _nin, ...rest } = entity;
  return rest;
}

export const dojahKycAdapter: KycProviderAdapter = {
  async verifyBvn(bvn: string): Promise<KycProviderResult> {
    try {
      const data = (await dojahGet('/api/v1/kyc/bvn', { bvn })) as {
        entity?: Record<string, unknown>;
      };
      if (data?.entity) {
        return {
          success: true,
          providerRef: `dojah_bvn_${Date.now()}`,
          metadata: { provider: 'dojah', ...redactSensitive(data.entity) },
        };
      }
      return { success: false, failureReason: 'BVN lookup returned no match' };
    } catch (err) {
      return { success: false, failureReason: (err as Error).message };
    }
  },

  async verifyNin(nin: string): Promise<KycProviderResult> {
    try {
      const data = (await dojahGet('/api/v1/kyc/nin', { nin })) as {
        entity?: Record<string, unknown>;
      };
      if (data?.entity) {
        return {
          success: true,
          providerRef: `dojah_nin_${Date.now()}`,
          metadata: { provider: 'dojah', ...redactSensitive(data.entity) },
        };
      }
      return { success: false, failureReason: 'NIN lookup returned no match' };
    } catch {
      return { success: false, failureReason: 'NIN lookup failed' };
    }
  },

  // NOT IMPLEMENTED — deliberately. Dojah's real selfie-liveness endpoint
  // (POST /api/v1/kyc/bvn/verify) requires the BVN and the selfie TOGETHER
  // in one call, not a standalone liveness check. That conflicts directly
  // with this project's rule of never persisting a raw BVN anywhere —
  // by the time the liveness step runs (a separate conversation state,
  // possibly minutes or days later), the plaintext BVN is already gone;
  // only its hash remains, on purpose.
  //
  // Using this endpoint for real would require restructuring the KYC flow
  // to hold the plaintext BVN in short-lived, unpersisted memory (e.g.
  // conversationContext, cleared immediately after use) across the BVN and
  // liveness steps — a real design decision, not a small tweak, and one
  // that should be made deliberately rather than backed into. Use the mock
  // adapter until this is properly worked through.
  async verifyLiveness(_selfieImage: Buffer): Promise<KycProviderResult> {
    throw new Error(
      'Dojah liveness verification requires restructuring the KYC flow to carry the BVN forward — see the comment on this method. Use KYC_PROVIDER=mock for now.',
    );
  },
};
