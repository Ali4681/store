import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const categories = ["أثاث", "إضاءة", "ديكور"] as const;
type ProductCategory = (typeof categories)[number];
type ProductFields = {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image: string;
  badge: string | null;
  stock: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProductCategory(value: unknown): value is ProductCategory {
  return (
    typeof value === "string" &&
    categories.some((category) => category === value)
  );
}

function isImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseProductInput(
  value: unknown,
  partial: false,
): ProductFields | null;
function parseProductInput(
  value: unknown,
  partial: true,
): Partial<ProductFields> | null;
function parseProductInput(
  value: unknown,
  partial: boolean,
): ProductFields | Partial<ProductFields> | null {
  if (!isRecord(value)) return null;

  const parsed: Partial<ProductFields> = {};
  const fields: (keyof ProductFields)[] = [
    "name",
    "description",
    "price",
    "category",
    "image",
    "badge",
    "stock",
  ];

  if (!partial && fields.some((field) => !(field in value))) return null;
  if (partial && !fields.some((field) => field in value)) return null;

  if ("name" in value) {
    if (typeof value.name !== "string" || value.name.trim().length < 2 || value.name.trim().length > 100) return null;
    parsed.name = value.name.trim();
  }
  if ("description" in value) {
    if (typeof value.description !== "string" || value.description.trim().length < 5 || value.description.trim().length > 1000) return null;
    parsed.description = value.description.trim();
  }
  if ("price" in value) {
    if (typeof value.price !== "number" || !Number.isSafeInteger(value.price) || value.price < 1 || value.price > 2_000_000_000) return null;
    parsed.price = value.price;
  }
  if ("category" in value) {
    if (!isProductCategory(value.category)) return null;
    parsed.category = value.category;
  }
  if ("image" in value) {
    if (!isImageUrl(value.image)) return null;
    parsed.image = value.image;
  }
  if ("badge" in value) {
    if (
      value.badge !== null &&
      (typeof value.badge !== "string" || value.badge.trim().length > 40)
    ) {
      return null;
    }
    parsed.badge =
      typeof value.badge === "string" ? value.badge.trim() || null : null;
  }
  if ("stock" in value) {
    if (typeof value.stock !== "number" || !Number.isSafeInteger(value.stock) || value.stock < 0 || value.stock > 1_000_000) return null;
    parsed.stock = value.stock;
  }

  if (partial) return parsed;
  if (
    parsed.name === undefined ||
    parsed.description === undefined ||
    parsed.price === undefined ||
    parsed.category === undefined ||
    parsed.image === undefined ||
    parsed.badge === undefined ||
    parsed.stock === undefined
  ) {
    return null;
  }

  return {
    name: parsed.name,
    description: parsed.description,
    price: parsed.price,
    category: parsed.category,
    image: parsed.image,
    badge: parsed.badge,
    stock: parsed.stock,
  };
}

async function authorizeAdmin(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "سجّل الدخول للمتابعة." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "ليس لديك صلاحية إدارة المنتجات." }, { status: 403 });
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const denied = await authorizeAdmin(request);
    if (denied) return denied;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "بيانات المنتج غير صالحة." }, { status: 400 });
    }

    const productData = parseProductInput(body, false);
    if (!productData) {
      return NextResponse.json({ error: "تحقّق من بيانات المنتج والسعر والكمية." }, { status: 400 });
    }

    const product = await prisma.product.create({ data: productData });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "يوجد منتج بهذا الاسم بالفعل." }, { status: 409 });
    }
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "تعذّرت إضافة المنتج." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "معرّف المنتج مطلوب." }, { status: 400 });
  }

  try {
    const denied = await authorizeAdmin(request);
    if (denied) return denied;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "بيانات التعديل غير صالحة." }, { status: 400 });
    }

    const productData = parseProductInput(body, true);
    if (!productData) {
      return NextResponse.json({ error: "أرسل حقلًا صالحًا واحدًا على الأقل." }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: productData,
    });
    return NextResponse.json(product);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "P2025" || error.code === "P2002")
    ) {
      const status = error.code === "P2025" ? 404 : 409;
      const message =
        status === 404 ? "المنتج غير موجود." : "يوجد منتج بهذا الاسم بالفعل.";
      return NextResponse.json({ error: message }, { status });
    }
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "تعذّر تعديل المنتج." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "معرّف المنتج مطلوب." }, { status: 400 });
  }

  try {
    const denied = await authorizeAdmin(request);
    if (denied) return denied;

    const result = await prisma.product.deleteMany({ where: { id } });
    if (!result.count) {
      return NextResponse.json({ error: "المنتج غير موجود." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "تعذّر حذف المنتج." }, { status: 503 });
  }
}
