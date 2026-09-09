import { config } from '../../../config/env';
import type { KycProviderAdapter, KycProviderResult } from '../kyc.types';

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

  async verifyLiveness(_selfieImage: Buffer): Promise<KycProviderResult> {
    throw new Error(
      'Dojah liveness verification requires restructuring the KYC flow to carry the BVN forward — see the comment on this method. Use KYC_PROVIDER=mock for now.',
    );
  },
};
