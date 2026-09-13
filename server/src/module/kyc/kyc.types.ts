export interface KycProviderResult {
  success: boolean;
  providerRef?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export interface KycProviderAdapter {
  verifyBvn(bvn: string): Promise<KycProviderResult>;
  verifyNin(nin: string): Promise<KycProviderResult>;
  verifyLiveness(selfieImage: Buffer): Promise<KycProviderResult>;
}

export interface OverallKycStatus {
  bvnVerified: boolean;
  ninVerified: boolean;
  livenessVerified: boolean;
  isFullyVerified: boolean;
}
