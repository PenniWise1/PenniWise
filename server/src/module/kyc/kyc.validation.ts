import { z } from 'zod';

export const bvnSchema = z
  .string()
  .regex(/^\d{11}$/, 'BVN must be exactly 11 digits');
export const ninSchema = z
  .string()
  .regex(/^\d{11}$/, 'NIN must be exactly 11 digits');
