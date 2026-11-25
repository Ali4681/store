import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export { hashPassword, verifyPassword } from "@/lib/password";
export const AUTH_COOKIE = "bayt-auth";
export const AUTH_SESSION_DAYS = 30;

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function publicUser(user: PublicUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function getUserForToken(token: string | undefined) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.authSession.delete({ where: { id: session.id } });
    return null;
  }

  return publicUser(session.user);
}

export async function getRequestUser(request: NextRequest) {
  return getUserForToken(request.cookies.get(AUTH_COOKIE)?.value);
}

export type StoreOwner =
  | { kind: "user"; userId: string }
  | { kind: "guest"; sessionId: string };

export async function resolveStoreOwner(
  request: NextRequest,
  guestSessionId: unknown,
): Promise<StoreOwner | null> {
  const user = await getRequestUser(request);
  if (user) return { kind: "user", userId: user.id };

  if (
    typeof guestSessionId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      guestSessionId,
    )
  ) {
    return { kind: "guest", sessionId: guestSessionId };
  }
  return null;
}

export function ownerWhere(owner: StoreOwner) {
  return owner.kind === "user"
    ? { userId: owner.userId }
    : { sessionId: owner.sessionId };
}
