import { NextRequest, NextResponse } from "next/server";
import { resolveStoreOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownerCreate, ownerLookup } from "@/lib/store-data";

export async function GET(request: NextRequest) {
  try {
    const owner = await resolveStoreOwner(
      request,
      request.nextUrl.searchParams.get("sessionId"),
    );
    if (!owner) {
      return NextResponse.json({ error: "معرّف الجلسة غير صالح." }, { status: 400 });
    }

    const favorites = await prisma.favorite.findMany({
      where: ownerLookup(owner),
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(favorites.map((favorite) => favorite.product));
  } catch (error) {
    console.error("Failed to load favorites:", error);
    return NextResponse.json({ error: "تعذّر تحميل المفضّلة." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let body: { sessionId?: unknown; productId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  if (typeof body.productId !== "string") {
    return NextResponse.json({ error: "معرّف المنتج غير صالح." }, { status: 400 });
  }

  try {
    const owner = await resolveStoreOwner(request, body.sessionId);
    if (!owner) {
      return NextResponse.json({ error: "معرّف الجلسة غير صالح." }, { status: 400 });
    }

    const productExists = await prisma.product.findUnique({
      where: { id: body.productId },
      select: { id: true },
    });
    if (!productExists) {
      return NextResponse.json({ error: "المنتج غير موجود." }, { status: 404 });
    }

    await prisma.favorite.upsert({
      where: owner.kind === "user"
        ? { userId_productId: { userId: owner.userId, productId: body.productId } }
        : {
            sessionId_productId: {
              sessionId: owner.sessionId,
              productId: body.productId,
            },
          },
      create: { ...ownerCreate(owner), productId: body.productId },
      update: {},
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add favorite:", error);
    return NextResponse.json({ error: "تعذّرت إضافة المنتج للمفضّلة." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "معرّف المنتج مطلوب." }, { status: 400 });
  }

  try {
    const owner = await resolveStoreOwner(
      request,
      request.nextUrl.searchParams.get("sessionId"),
    );
    if (!owner) {
      return NextResponse.json({ error: "معرّف الجلسة غير صالح." }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: { ...ownerLookup(owner), productId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove favorite:", error);
    return NextResponse.json({ error: "تعذّرت إزالة المنتج من المفضّلة." }, { status: 503 });
  }
}
