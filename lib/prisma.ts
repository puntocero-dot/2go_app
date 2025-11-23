import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configuración para manejar latencia por mantenimiento de Supabase
    transactionOptions: {
      timeout: 30000, // 30 segundos
      maxWait: 25000, // 25 segundos
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
