import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AUTH_COOKIE, getUserForToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductManager from "@/app/admin/ProductManager";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const user = await getUserForToken(cookieStore.get(AUTH_COOKIE)?.value);
  if (!user || user.role !== "ADMIN") redirect("/");

  const [customerCount, products] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="brand" href="/">
          <Image className="brand-mark" src="/logo.svg" width={34} height={34} alt="" />
          <span className="brand-name">بيت<span>.</span></span>
        </Link>
        <Link className="admin-back" href="/?view=store">العودة إلى المتجر <ArrowLeft size={16} /></Link>
      </header>
      <section className="admin-content">
        <span className="eyebrow section-eyebrow"><span /> مساحة خاصة بالمدير</span>
        <h1>أهلًا {user.name}</h1>
        <p className="admin-description">نظرة سريعة على متجرك ومنتجات بيت.</p>
        <ProductManager initialProducts={products} customerCount={customerCount} />
      </section>
    </main>
  );
}
