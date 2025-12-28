import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const SLOW_QUERY_THRESHOLD_MS = 1000; // 1 segundo

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" 
    ? [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ] 
    : [{ emit: 'stdout', level: 'error' }],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  transactionOptions: {
    timeout: 30000,
    maxWait: 25000,
  },
});

// Logging de queries lentas en desarrollo
if (process.env.NODE_ENV === "development") {
  basePrisma.$on('query', (e) => {
    if (e.duration > SLOW_QUERY_THRESHOLD_MS) {
      console.warn(`
⚠️  SLOW QUERY DETECTED
Duration: ${e.duration}ms
Query: ${e.query.substring(0, 200)}${e.query.length > 200 ? '...' : ''}
Params: ${e.params.substring(0, 100)}${e.params.length > 100 ? '...' : ''}
      `);
    } else if (e.duration > 100) {
      console.log(`[Prisma] ${e.duration}ms - ${e.query.substring(0, 80)}...`);
    }
  });
}

export const prisma = globalForPrisma.prisma ?? basePrisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
