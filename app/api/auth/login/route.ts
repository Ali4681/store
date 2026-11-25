import { NextRequest, NextResponse } from "next/server";
import { createAuthSession, setAuthCookie } from "@/lib/auth-session";
import {
  AUTH_COOKIE,
  hashSessionToken,
  normalizeEmail,
  publicUser,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moveGuestDataToUser } from "@/lib/store-data";

export async function POST(request: NextRequest) {
  let body: {
    email?: unknown;
    password?: unknown;
    sessionId?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات تسجيل الدخول غير صالحة." }, { status: 400 });
  }

  if (
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    typeof body.password !== "string" ||
    body.password.length > 128
  ) {
    return NextResponse.json({ error: "تحقّق من البريد وكلمة المرور." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(body.email) },
    });
    if (
      !user ||
      !(await verifyPassword(body.password, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: "البريد أو كلمة المرور غير صحيحة." },
        { status: 401 },
      );
    }

    const guestSessionId =
      typeof body.sessionId === "string" ? body.sessionId : undefined;
    await prisma.$transaction((transaction) =>
      moveGuestDataToUser(transaction, guestSessionId, user.id),
    );

    const previousToken = request.cookies.get(AUTH_COOKIE)?.value;
    if (previousToken && /^[a-f0-9]{64}$/.test(previousToken)) {
      await prisma.authSession.deleteMany({
        where: { tokenHash: hashSessionToken(previousToken) },
      });
    }

    const token = await createAuthSession(user.id);
    const response = NextResponse.json({ user: publicUser(user) });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Failed to sign in:", error);
    return NextResponse.json({ error: "تعذّر تسجيل الدخول." }, { status: 503 });
  }
}
