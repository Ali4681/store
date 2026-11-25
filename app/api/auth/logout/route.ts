import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, hashSessionToken } from "@/lib/auth";
import { clearAuthCookie } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      await prisma.authSession.deleteMany({
        where: { tokenHash: hashSessionToken(token) },
      });
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error("Failed to sign out:", error);
    return NextResponse.json({ error: "تعذّر تسجيل الخروج." }, { status: 503 });
  }
}
