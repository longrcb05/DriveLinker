import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client để tránh tạo nhiều connection pool trong quá trình Hot-Reload (Next.js dev).
 * Lập trình thủ công 100%.
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
