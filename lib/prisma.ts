import { PrismaClient } from '@/generated/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Extract Accelerator URL from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
const isAcceleratorUrl = databaseUrl?.startsWith('prisma+');

const logLevel: ('query' | 'error' | 'warn')[] = 
  process.env.NODE_ENV === 'development' 
    ? ['error']
    : ['error'];

/**
 * Membuat instance PrismaClient sesuai environment.
 * Mendukung Prisma Accelerate bila `DATABASE_URL` menggunakan prefix `prisma+`.
 */
const createPrismaClient = () => {
  const baseConfig = {
    log: logLevel,
  };

  if (isAcceleratorUrl && databaseUrl) {
    return new PrismaClient({
      ...baseConfig,
      accelerateUrl: databaseUrl,
    });
  }
  
  return new (PrismaClient as unknown as new () => PrismaClient)();
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// Verify that preset model exists (for debugging)
if (process.env.NODE_ENV === 'development' && !('preset' in prisma)) {
  console.warn('Warning: preset model not found in Prisma client. Please restart the server.');
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
