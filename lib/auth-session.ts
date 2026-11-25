import { randomBytes } from "node:crypto";
import type { NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_SESSION_DAYS, hashSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function createAuthSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.authSession.create({
    data: { userId, tokenHash: hashSessionToken(token), expiresAt },
  });
  return token;
}
