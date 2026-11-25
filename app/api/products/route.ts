import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to load products:", error);
    return NextResponse.json(
      { error: "تعذّر تحميل المنتجات. تأكد من اتصال قاعدة البيانات." },
      { status: 503 },
    );
  }
}
