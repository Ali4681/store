"use client";

import Image from "next/image";
import { useState } from "react";
import { Boxes, Check, PackageCheck, Pencil, Plus, Trash2, X } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badge: string | null;
  stock: number;
};

type ProductDraft = {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badge: string;
  stock: number;
};

const emptyDraft: ProductDraft = {
  name: "",
  description: "",
  price: 0,
  category: "أثاث",
  image: "",
  badge: "",
  stock: 10,
};

const currency = new Intl.NumberFormat("ar-SY", {
  style: "currency",
  currency: "SYP",
  maximumFractionDigits: 0,
});

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error ?? "تعذّر تنفيذ الطلب.");
  }
  return result as T;
}

export default function ProductManager({
  initialProducts,
  customerCount,
}: {
  initialProducts: Product[];
  customerCount: number;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function startCreate() {
    setDraft({ ...emptyDraft });
    setEditingId(null);
    setError("");
    setNotice("");
  }

  function startEdit(product: Product) {
    setDraft({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      badge: product.badge ?? "",
      stock: product.stock,
    });
    setEditingId(product.id);
    setError("");
    setNotice("");
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    setBusy(true);
    setError("");
    try {
      const body = { ...draft, badge: draft.badge.trim() || null };
      if (editingId) {
        const updated = await requestJson<Product>(
          `/api/admin/products?id=${encodeURIComponent(editingId)}`,
          { method: "PATCH", body: JSON.stringify(body) },
        );
        setProducts((current) =>
          current.map((product) => (product.id === updated.id ? updated : product)),
        );
        setNotice("تم حفظ تعديلات المنتج");
      } else {
        const created = await requestJson<Product>("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setProducts((current) => [created, ...current]);
        setNotice("تمت إضافة المنتج");
      }
      setDraft(null);
      setEditingId(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذّر حفظ المنتج.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`هل تريد حذف «${product.name}»؟`)) return;
    setError("");
    setNotice("");
    try {
      await requestJson<{ success: boolean }>(
        `/api/admin/products?id=${encodeURIComponent(product.id)}`,
        { method: "DELETE" },
      );
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setNotice("تم حذف المنتج");
      if (editingId === product.id) {
        setDraft(null);
        setEditingId(null);
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "تعذّر حذف المنتج.",
      );
    }
  }

  return (
    <>
      <div className="admin-stats">
        <article className="admin-stat">
          <span className="admin-stat-icon"><Boxes size={20} /></span>
          <div><small>منتجات المتجر</small><strong>{products.length}</strong></div>
        </article>
        <article className="admin-stat">
          <span className="admin-stat-icon"><PackageCheck size={20} /></span>
          <div><small>حسابات الزبائن</small><strong>{customerCount}</strong></div>
        </article>
      </div>

      <section className="admin-products">
        <div className="admin-products-heading">
          <div>
            <h2>إدارة المنتجات</h2>
            <span>{products.length} منتج</span>
          </div>
          <button className="admin-add-button" onClick={startCreate}>
            <Plus size={16} /> إضافة منتج
          </button>
        </div>

        {error && <p className="admin-feedback error" role="alert">{error}</p>}
        {notice && <p className="admin-feedback success"><Check size={15} />{notice}</p>}

        {draft && (
          <form className="admin-product-form" onSubmit={(event) => void saveProduct(event)}>
            <div className="admin-form-heading">
              <h3>{editingId ? "تعديل المنتج" : "منتج جديد"}</h3>
              <button
                type="button"
                className="admin-cancel-icon"
                aria-label="إغلاق النموذج"
                onClick={() => { setDraft(null); setEditingId(null); }}
                disabled={busy}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              اسم المنتج
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                minLength={2}
                maxLength={100}
                required
              />
            </label>
            <label className="admin-form-wide">
              الوصف
              <textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                minLength={5}
                maxLength={1000}
                rows={3}
                required
              />
            </label>
            <label>
              السعر بالليرة السورية
              <input
                type="number"
                inputMode="numeric"
                value={draft.price || ""}
                onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
                min={1}
                max={2_000_000_000}
                step={1}
                required
              />
            </label>
            <label>
              الكمية المتوفرة
              <input
                type="number"
                inputMode="numeric"
                value={draft.stock}
                onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })}
                min={0}
                max={1_000_000}
                step={1}
                required
              />
            </label>
            <label>
              التصنيف
              <select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              >
                <option value="أثاث">أثاث</option>
                <option value="إضاءة">إضاءة</option>
                <option value="ديكور">ديكور</option>
              </select>
            </label>
            <label>
              شارة المنتج (اختياري)
              <input
                value={draft.badge}
                onChange={(event) => setDraft({ ...draft, badge: event.target.value })}
                maxLength={40}
                placeholder="وصل حديثًا"
              />
            </label>
            <label className="admin-form-wide">
              رابط صورة المنتج
              <input
                type="url"
                dir="ltr"
                value={draft.image}
                onChange={(event) => setDraft({ ...draft, image: event.target.value })}
                maxLength={2048}
                placeholder="https://..."
                required
              />
            </label>
            <div className="admin-form-actions admin-form-wide">
              <button className="admin-save-button" type="submit" disabled={busy}>
                {busy ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة المنتج"}
              </button>
              <button
                className="admin-cancel-button"
                type="button"
                onClick={() => { setDraft(null); setEditingId(null); }}
                disabled={busy}
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        {products.length ? (
          <div className="admin-product-list">
            {products.map((product) => (
              <article className="admin-product-row" key={product.id}>
                <div className="admin-product-main">
                  <div className="admin-product-image">
                    <Image src={product.image} alt="" fill sizes="52px" unoptimized />
                  </div>
                  <div className="admin-product-title">
                    <strong>{product.name}</strong>
                    <small>{product.category}{product.badge ? ` · ${product.badge}` : ""}</small>
                  </div>
                </div>
                <div className="admin-product-details">
                  <span>{currency.format(product.price)}</span>
                  <small className={product.stock === 0 ? "stock-empty" : ""}>
                    {product.stock === 0 ? "نفدت الكمية" : `${product.stock} متوفر`}
                  </small>
                </div>
                <div className="admin-product-actions">
                  <button
                    className="admin-edit-button"
                    aria-label={`تعديل ${product.name}`}
                    onClick={() => startEdit(product)}
                  >
                    <Pencil size={15} /><span>تعديل</span>
                  </button>
                  <button
                    className="admin-delete-button"
                    aria-label={`حذف ${product.name}`}
                    onClick={() => void deleteProduct(product)}
                  >
                    <Trash2 size={15} /><span>حذف</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">لا توجد منتجات بعد. أضف أول منتج للمتجر.</p>
        )}
      </section>
    </>
  );
}
