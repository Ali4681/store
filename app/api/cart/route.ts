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

    const cart = await prisma.cart.findUnique({
      where: ownerLookup(owner),
      include: { items: { include: { product: true } } },
    });
    return NextResponse.json(cart?.items ?? []);
  } catch (error) {
    console.error("Failed to load cart:", error);
    return NextResponse.json({ error: "تعذّر تحميل السلة." }, { status: 503 });
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

    const productId = body.productId;

    const addError = await prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      if (!product) return "missing";
      if (product.stock < 1) return "unavailable";

      const cart = await transaction.cart.upsert({
        where: ownerLookup(owner),
        create: ownerCreate(owner),
        update: {},
      });

      const existing = await transaction.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
        select: { quantity: true },
      });
      if (existing && existing.quantity >= product.stock) return "limit";

      await transaction.cartItem.upsert({
        where: {
          cartId_productId: { cartId: cart.id, productId },
        },
        create: { cartId: cart.id, productId, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });
      return null;
    });
    if (addError === "missing") {
      return NextResponse.json({ error: "المنتج غير موجود." }, { status: 404 });
    }
    if (addError === "unavailable" || addError === "limit") {
      return NextResponse.json(
        { error: "الكمية المطلوبة غير متوفرة في المخزون." },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add product to cart:", error);
    return NextResponse.json({ error: "تعذّرت إضافة المنتج إلى السلة." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: { sessionId?: unknown; productId?: unknown; quantity?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  if (
    typeof body.productId !== "string" ||
    typeof body.quantity !== "number" ||
    !Number.isInteger(body.quantity) ||
    body.quantity < 1 ||
    body.quantity > 99
  ) {
    return NextResponse.json({ error: "بيانات الكمية غير صالحة." }, { status: 400 });
  }

  try {
    const owner = await resolveStoreOwner(request, body.sessionId);
    if (!owner) {
      return NextResponse.json({ error: "معرّف الجلسة غير صالح." }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({ where: ownerLookup(owner) });
    if (!cart) return NextResponse.json({ error: "السلة غير موجودة." }, { status: 404 });

    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      select: { stock: true },
    });
    if (!product) {
      return NextResponse.json({ error: "المنتج غير موجود." }, { status: 404 });
    }
    if (body.quantity > product.stock) {
      return NextResponse.json(
        { error: "الكمية المطلوبة غير متوفرة في المخزون." },
        { status: 409 },
      );
    }

    await prisma.cartItem.update({
      where: {
        cartId_productId: { cartId: cart.id, productId: body.productId },
      },
      data: { quantity: body.quantity },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update cart item:", error);
    return NextResponse.json({ error: "تعذّر تحديث الكمية." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");

  try {
    const owner = await resolveStoreOwner(
      request,
      request.nextUrl.searchParams.get("sessionId"),
    );
    if (!owner) {
      return NextResponse.json({ error: "معرّف الجلسة غير صالح." }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({ where: ownerLookup(owner) });
    if (cart) {
      if (productId) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
      } else {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove cart item:", error);
    return NextResponse.json({ error: "تعذّر حذف المنتج من السلة." }, { status: 503 });
  }
}
