import type { KycProviderAdapter } from '../kyc.types';

const TEST_BVN = '22222222222';
const TEST_NIN = '11111111111';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockKycAdapter: KycProviderAdapter = {
  async verifyBvn(bvn) {
    await delay(300);
    if (bvn === TEST_BVN) {
      return {
        success: true,
        providerRef: `mock_bvn_${Date.now()}`,
        metadata: { provider: 'mock', matchedName: 'Test User' },
      };
    }
    return {
      success: false,
      failureReason:
        'BVN not found or does not match our records (mock adapter)',
    };
  },

  async verifyNin(nin) {
    await delay(300);
    if (nin === TEST_NIN) {
      return {
        success: true,
        providerRef: `mock_nin_${Date.now()}`,
        metadata: { provider: 'mock' },
      };
    }
    return {
      success: false,
      failureReason:
        'NIN not found or does not match our records (mock adapter)',
    };
  },

  async verifyLiveness(selfieImage) {
    await delay(500);
    if (selfieImage.length === 0) {
      return {
        success: false,
        failureReason: 'No image received (mock adapter)',
      };
    }
    return {
      success: true,
      providerRef: `mock_liveness_${Date.now()}`,
      metadata: { provider: 'mock', livenessScore: 0.97 },
    };
  },
};
