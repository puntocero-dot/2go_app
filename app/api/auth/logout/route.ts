import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  await destroySession();
  const redirectTo =
    request.nextUrl.searchParams.get("redirect") ?? "/login";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}