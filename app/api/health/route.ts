import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();

  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  return NextResponse.json({
    status: dbConnected ? "ok" : "degraded",
    version: process.env.npm_package_version || "0.1.1",
    timestamp: new Date().toISOString(),
    dbConnected,
    responseTimeMs: Date.now() - startTime,
  });
}
