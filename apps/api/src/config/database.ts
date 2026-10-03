import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? ['error'] : ['query', 'error', 'warn'],
  // Tests point the client at a throwaway database; otherwise the schema's own URL is used
  datasourceUrl: process.env.TEST_DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 