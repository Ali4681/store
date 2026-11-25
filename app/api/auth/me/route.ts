import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ user: await getRequestUser(request) });
  } catch (error) {
    console.error("Failed to read current user:", error);
    return NextResponse.json({ error: "تعذّر التحقق من الحساب." }, { status: 503 });
  }
}
