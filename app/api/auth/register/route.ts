import { NextRequest, NextResponse } from "next/server";
import { createAuthSession, setAuthCookie } from "@/lib/auth-session";
import { hashPassword, normalizeEmail, publicUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moveGuestDataToUser } from "@/lib/store-data";

export async function POST(request: NextRequest) {
  let body: { name?: unknown; email?: unknown; password?: unknown; sessionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات التسجيل غير صالحة." }, { status: 400 });
  }

  if (
    typeof body.name !== "string" ||
    body.name.trim().length < 2 ||
    body.name.trim().length > 60 ||
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
    typeof body.password !== "string" ||
    body.password.length < 6 ||
    body.password.length > 128
  ) {
    return NextResponse.json(
      { error: "أدخل اسمًا وبريدًا صالحًا، وكلمة مرور من ٦ أحرف على الأقل." },
      { status: 400 },
    );
  }

  try {
    const email = normalizeEmail(body.email);
    const name = body.name.trim();
    const passwordHash = await hashPassword(body.password);
    const user = await prisma.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: { name, email, passwordHash, role: "CUSTOMER" },
      });
      await moveGuestDataToUser(
        transaction,
        typeof body.sessionId === "string" ? body.sessionId : undefined,
        created.id,
      );
      return created;
    });

    const token = await createAuthSession(user.id);
    const response = NextResponse.json({ user: publicUser(user) }, { status: 201 });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "هذا البريد مسجّل بالفعل. سجّل الدخول بدلًا من ذلك." },
        { status: 409 },
      );
    }
    console.error("Failed to register customer:", error);
    return NextResponse.json({ error: "تعذّر إنشاء الحساب." }, { status: 503 });
  }
}
