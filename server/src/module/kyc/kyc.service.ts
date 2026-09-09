import crypto from 'crypto';
import { kycRepository } from './kyc.repository';
import { mockKycAdapter } from './providers/mock-kyc.adapter';
import { dojahKycAdapter } from './providers/dojah-kyc.adapter';
import { bvnSchema, ninSchema } from './kyc.validation';
import { config } from '../../config/env';
import { usersRepository } from '../users/users.repository';
import type { Prisma } from '../../generated/prisma';
import type {
  KycProviderAdapter,
  KycProviderResult,
  OverallKycStatus,
} from './kyc.types';

const provider: KycProviderAdapter =
  config.kyc.provider === 'dojah' ? dojahKycAdapter : mockKycAdapter;

function hashValue(value: string): string {
  return crypto
    .createHmac('sha256', config.kyc.hashPepper)
    .update(value)
    .digest('hex');
}

export async function verifyBvn(
  userId: string,
  bvn: string,
): Promise<KycProviderResult> {
  const parsed = bvnSchema.safeParse(bvn);
  if (!parsed.success) {
    return {
      success: false,
      failureReason: parsed.error.issues[0]?.message ?? 'Invalid BVN',
    };
  }

  const result = await provider.verifyBvn(bvn);
  await kycRepository.create({
    userId,
    type: 'BVN',
    status: result.success ? 'VERIFIED' : 'FAILED',
    valueHash: hashValue(bvn),
    providerRef: result.providerRef ?? null,
    metadata: (result.metadata ?? {}) as Prisma.InputJsonValue,
    failureReason: result.failureReason ?? null,
  });
  return result;
}

export async function verifyNin(
  userId: string,
  nin: string,
): Promise<KycProviderResult> {
  const parsed = ninSchema.safeParse(nin);
  if (!parsed.success) {
    return {
      success: false,
      failureReason: parsed.error.issues[0]?.message ?? 'Invalid NIN',
    };
  }

  const result = await provider.verifyNin(nin);
  await kycRepository.create({
    userId,
    type: 'NIN',
    status: result.success ? 'VERIFIED' : 'FAILED',
    valueHash: hashValue(nin),
    providerRef: result.providerRef ?? null,
    metadata: (result.metadata ?? {}) as Prisma.InputJsonValue,
    failureReason: result.failureReason ?? null,
  });
  return result;
}

export async function verifyLiveness(
  userId: string,
  selfieImage: Buffer,
): Promise<KycProviderResult> {
  const result = await provider.verifyLiveness(selfieImage);
  await kycRepository.create({
    userId,
    type: 'LIVENESS',
    status: result.success ? 'VERIFIED' : 'FAILED',
    providerRef: result.providerRef ?? null,
    metadata: (result.metadata ?? {}) as Prisma.InputJsonValue,
    failureReason: result.failureReason ?? null,
  });
  return result;
}

export async function getOverallStatus(
  userId: string,
): Promise<OverallKycStatus> {
  const records = await kycRepository.listForUser(userId);
  const latest = (type: 'BVN' | 'NIN' | 'LIVENESS') =>
    records.find((r) => r.type === type);

  const bvnVerified = latest('BVN')?.status === 'VERIFIED';
  const ninVerified = latest('NIN')?.status === 'VERIFIED';
  const livenessVerified = latest('LIVENESS')?.status === 'VERIFIED';

  return {
    bvnVerified,
    ninVerified,
    livenessVerified,
    isFullyVerified: bvnVerified && ninVerified && livenessVerified,
  };
}

export async function completeKycIfEligible(userId: string): Promise<boolean> {
  const status = await getOverallStatus(userId);
  if (!status.isFullyVerified) return false;

  await usersRepository.updateStatus(userId, 'ACTIVE');
  return true;
}
