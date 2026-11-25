"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpLeft,
  Check,
  Heart,
  LogOut,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

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

type CartLine = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

type Panel = "cart" | "favorites" | null;
type Account = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

const categories = ["الكل", "أثاث", "إضاءة", "ديكور"];
const currency = new Intl.NumberFormat("ar-SA", {
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
    throw new Error(result.error ?? "حدث خطأ غير متوقع.");
  }
  return result as T;
}

function getStoredSessionId() {
  const stored = window.localStorage.getItem("bayt-session-id");
  if (stored) return stored;
  const sessionId = window.crypto.randomUUID();
  window.localStorage.setItem("bayt-session-id", sessionId);
  return sessionId;
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSessionData = useCallback(async (id: string) => {
    const [cartItems, favoriteProducts] = await Promise.all([
      requestJson<CartLine[]>(`/api/cart?sessionId=${encodeURIComponent(id)}`),
      requestJson<Product[]>(
        `/api/favorites?sessionId=${encodeURIComponent(id)}`,
      ),
    ]);
    setCart(cartItems);
    setFavorites(favoriteProducts);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const [loadedProducts, currentAccount] = await Promise.all([
          requestJson<Product[]>("/api/products"),
          requestJson<{ user: Account | null }>("/api/auth/me"),
        ]);
        if (!active) return;
        setProducts(loadedProducts);
        setAccount(currentAccount.user);
        const viewingStoreAsAdmin =
          new URLSearchParams(window.location.search).get("view") === "store";
        if (currentAccount.user?.role === "ADMIN" && !viewingStoreAsAdmin) {
          router.replace("/admin");
          return;
        }
        const id = getStoredSessionId();
        setSessionId(id);
        await loadSessionData(id);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "تعذّر تحميل المتجر. حاول مرة أخرى.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [loadSessionData, router]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ar");
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "الكل" || product.category === selectedCategory;
      const matchesSearch =
        !term ||
        `${product.name} ${product.description} ${product.category}`
          .toLocaleLowerCase("ar")
          .includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const favoriteIds = new Set(favorites.map((product) => product.id));

  async function addToCart(product: Product) {
    if (!sessionId) return;
    try {
      await requestJson("/api/cart", {
        method: "POST",
        body: JSON.stringify({ sessionId, productId: product.id }),
      });
      await loadSessionData(sessionId);
      setNotice(`أُضيف ${product.name} إلى حقيبتك`);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "تعذّرت إضافة المنتج.",
      );
    }
  }

  async function toggleFavorite(product: Product) {
    if (!sessionId) return;
    const isFavorite = favoriteIds.has(product.id);
    try {
      if (isFavorite) {
        await requestJson(
          `/api/favorites?sessionId=${encodeURIComponent(sessionId)}&productId=${encodeURIComponent(product.id)}`,
          { method: "DELETE" },
        );
        setFavorites((current) =>
          current.filter((item) => item.id !== product.id),
        );
        setNotice("أُزيل المنتج من المفضّلة");
      } else {
        await requestJson("/api/favorites", {
          method: "POST",
          body: JSON.stringify({ sessionId, productId: product.id }),
        });
        setFavorites((current) => [product, ...current]);
        setNotice("أُضيف المنتج إلى المفضّلة");
      }
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "تعذّر تحديث المفضّلة.",
      );
    }
  }

  async function updateQuantity(item: CartLine, quantity: number) {
    if (!sessionId) return;
    try {
      await requestJson("/api/cart", {
        method: "PATCH",
        body: JSON.stringify({
          sessionId,
          productId: item.productId,
          quantity,
        }),
      });
      setCart((current) =>
        current.map((line) =>
          line.productId === item.productId ? { ...line, quantity } : line,
        ),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "تعذّر تحديث الكمية.",
      );
    }
  }

  async function removeFromCart(productId: string) {
    if (!sessionId) return;
    try {
      await requestJson(
        `/api/cart?sessionId=${encodeURIComponent(sessionId)}&productId=${encodeURIComponent(productId)}`,
        { method: "DELETE" },
      );
      setCart((current) =>
        current.filter((item) => item.productId !== productId),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "تعذّر حذف المنتج.",
      );
    }
  }

  async function removeFavorite(productId: string) {
    if (!sessionId) return;
    try {
      await requestJson(
        `/api/favorites?sessionId=${encodeURIComponent(sessionId)}&productId=${encodeURIComponent(productId)}`,
        { method: "DELETE" },
      );
      setFavorites((current) =>
        current.filter((item) => item.id !== productId),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "تعذّرت إزالة المنتج.",
      );
    }
  }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      sessionId,
    };

    try {
      const result =
        authMode === "register"
          ? await requestJson<{ user: Account }>("/api/auth/register", {
              method: "POST",
              body: JSON.stringify({
                ...payload,
                name: String(formData.get("name") ?? ""),
              }),
            })
          : await requestJson<{ user: Account }>("/api/auth/login", {
              method: "POST",
              body: JSON.stringify(payload),
            });
      setAccount(result.user);
      setAuthOpen(false);
      if (result.user.role === "ADMIN") {
        router.replace("/admin");
        return;
      }
      await loadSessionData(sessionId);
      setNotice(`أهلًا ${result.user.name}، سعيدون بعودتك`);
    } catch (authActionError) {
      setAuthError(
        authActionError instanceof Error
          ? authActionError.message
          : "تعذّر تسجيل الدخول.",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    try {
      await requestJson("/api/auth/logout", { method: "POST" });
      setAccount(null);
      await loadSessionData(sessionId);
      setNotice("تم تسجيل الخروج من حسابك");
    } catch (authActionError) {
      setError(
        authActionError instanceof Error
          ? authActionError.message
          : "تعذّر تسجيل الخروج.",
      );
    }
  }

  function scrollToProducts() {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <div className="announcement">
        <Sparkles size={14} />
        <span>لمسات صغيرة، فرق كبير — شحن مجاني للطلبات فوق ٥٠٠ ألف ليرة</span>
        <ArrowLeft size={14} />
      </div>

      <header className="site-header">
        <a className="brand" href="#" aria-label="بيت، الصفحة الرئيسية">
          <Image className="brand-mark" src="/logo.svg" width={34} height={34} alt="" />
          <span className="brand-name">
            بيت<span>.</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="التنقل الرئيسي">
          <a className="nav-active" href="#products">
            تسوّق
          </a>
          <a href="#story">قصتنا</a>
          <a href="#newsletter">مجلة بيت</a>
        </nav>

        <div className="header-actions">
          <label className="search-box">
            <Search size={17} />
            <input
              aria-label="ابحث عن منتج"
              placeholder="عن ماذا تبحث؟"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <kbd>/</kbd>
          </label>
          <button
            className="icon-button favorite-header"
            aria-label={`المفضّلة، ${favorites.length} منتجات`}
            onClick={() => setPanel("favorites")}
          >
            <Heart size={20} />
            {favorites.length > 0 && (
              <span className="count-badge">{favorites.length}</span>
            )}
          </button>
          <button
            className="cart-button"
            aria-label={`حقيبة التسوق، ${cartCount} منتجات`}
            onClick={() => setPanel("cart")}
          >
            <ShoppingBag size={18} />
            <span>حقيبتي</span>
            <span className="cart-count">{cartCount}</span>
          </button>
          {account ? (
            <>
              {account.role === "ADMIN" ? (
                <a className="account-link" href="/admin" aria-label="لوحة الإدارة">
                  <UserRound size={17} />
                  <span>الإدارة</span>
                </a>
              ) : (
                <span className="account-greeting" title={account.email}>
                  <UserRound size={17} />
                  <span>{account.name.split(" ")[0]}</span>
                </span>
              )}
              <button
                className="icon-button signout-button"
                aria-label="تسجيل الخروج"
                onClick={() => void signOut()}
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <button
              className="login-button"
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
                setAuthOpen(true);
              }}
            >
              <UserRound size={17} />
              <span>دخول</span>
            </button>
          )}
        </div>
      </header>

      <section className="hero" id="story">
        <div className="hero-copy">
          <span className="eyebrow">
            <span /> تصميم يعيش معك
          </span>
          <h1>
            بيتك، على
            <br />
            ذوقك <em>تماماً.</em>
          </h1>
          <p>قطع مختارة بعناية، تجمع بين جمال التفاصيل وراحة الحياة اليومية.</p>
          <button className="hero-cta" onClick={scrollToProducts}>
            اكتشف تشكيلتنا <ArrowLeft size={17} />
          </button>
          <div className="hero-footnote">
            <div className="avatar-stack" aria-hidden="true">
              <span>م</span>
              <span>ر</span>
              <span>ل</span>
            </div>
            <span>أكثر من ٢,٤٠٠ بيت صار أحلى</span>
          </div>
        </div>

        <div
          className="hero-visual"
          aria-label="غرفة معيشة هادئة بألوان طبيعية"
        >
          <div className="hero-image" />
          <div className="hero-image-tint" />
          <div className="image-note">
            <span className="note-sparkle">
              <Sparkles size={15} />
            </span>
            <div>
              <strong>مساحة هادئة</strong>
              <small>مجموعة الربيع · ٢٠٢٦</small>
            </div>
            <ArrowUpLeft size={17} />
          </div>
          <div className="hero-index">
            <span>01</span> / 03
          </div>
          <span className="decor-dot decor-dot-one" />
          <span className="decor-dot decor-dot-two" />
        </div>
        <div className="hero-side-label">مساحات تشبهك — منذ ٢٠٢١</div>
      </section>

      <section className="benefits" aria-label="مميزات بيت">
        <div className="benefit">
          <span className="benefit-icon">✳</span>
          <div>
            <strong>جودة تدوم</strong>
            <small>تفاصيل تعيش معك</small>
          </div>
        </div>
        <span className="benefit-divider" />
        <div className="benefit">
          <span className="benefit-icon">⌁</span>
          <div>
            <strong>توصيل لكل مكان</strong>
            <small>على باب بيتك</small>
          </div>
        </div>
        <span className="benefit-divider" />
        <div className="benefit">
          <span className="benefit-icon">♡</span>
          <div>
            <strong>اختيارات بحب</strong>
            <small>كل قطعة لها حكاية</small>
          </div>
        </div>
        <span className="benefit-divider" />
        <div className="benefit">
          <span className="benefit-icon">↺</span>
          <div>
            <strong>تبديل سهل</strong>
            <small>خلال ١٤ يومًا</small>
          </div>
        </div>
      </section>

      <section className="shop-section" id="products">
        <div className="section-heading">
          <div>
            <span className="eyebrow section-eyebrow">
              <span /> اختيرت لك
            </span>
            <h2>
              تفاصيل <em>تحبّها.</em>
            </h2>
            <p>أشياء جميلة، تجعل كل يوم ألطف.</p>
          </div>
          <button
            className="view-all"
            onClick={() => {
              setSelectedCategory("الكل");
              setSearch("");
            }}
          >
            كل المنتجات <ArrowLeft size={16} />
          </button>
        </div>

        <div className="shop-toolbar">
          <div
            className="category-list"
            role="tablist"
            aria-label="تصنيفات المنتجات"
          >
            {categories.map((category) => (
              <button
                key={category}
                role="tab"
                aria-selected={selectedCategory === category}
                className={
                  selectedCategory === category
                    ? "category-chip selected"
                    : "category-chip"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
                {category === "الكل" && <span>{products.length}</span>}
              </button>
            ))}
          </div>
          <button
            className="filter-button"
            aria-label="مسح فلاتر البحث والتصنيف"
            onClick={() => {
              setSelectedCategory("الكل");
              setSearch("");
            }}
          >
            <SlidersHorizontal size={16} /> مسح الفلاتر
          </button>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button aria-label="إغلاق التنبيه" onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="product-grid" aria-label="جارٍ تحميل المنتجات">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="skeleton-card" key={index} />
            ))}
          </div>
        ) : visibleProducts.length ? (
          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article className="product-card" key={product.id}>
                <div className={`product-image-wrap image-tone-${index % 4}`}>
                  <Image
                    className="product-image"
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw"
                    unoptimized
                  />
                  {product.badge && (
                    <span className="product-badge">{product.badge}</span>
                  )}
                  <button
                    className={
                      favoriteIds.has(product.id)
                        ? "product-favorite is-favorite"
                        : "product-favorite"
                    }
                    aria-label={
                      favoriteIds.has(product.id)
                        ? "إزالة من المفضّلة"
                        : "أضف إلى المفضّلة"
                    }
                    onClick={() => void toggleFavorite(product)}
                  >
                    <Heart
                      size={18}
                      fill={
                        favoriteIds.has(product.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                  <button
                    className={
                      product.stock > 0 ? "quick-add" : "quick-add unavailable"
                    }
                    disabled={product.stock < 1}
                    aria-label={
                      product.stock > 0 ? "أضف للحقيبة" : "نفدت الكمية"
                    }
                    onClick={() => void addToCart(product)}
                  >
                    {product.stock > 0 && <Plus size={16} />}
                    <span>
                      {product.stock > 0 ? "أضف للحقيبة" : "نفدت الكمية"}
                    </span>
                  </button>
                </div>
                <div className="product-info">
                  <div className="product-title-row">
                    <h3>{product.name}</h3>
                    <span className="product-price">
                      {currency.format(product.price)}
                    </span>
                  </div>
                  <div className="product-subtitle">
                    <span>
                      {product.category} ·{" "}
                      {product.stock > 0
                        ? `${product.stock} متوفر`
                        : "نفدت الكمية"}
                    </span>
                    <span className="rating">
                      <span>★</span> ٤.٩
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-products">
            <Search size={27} />
            <h3>ما لقينا شيء هنا</h3>
            <p>جرّب كلمة ثانية أو تصفّح كل القطع.</p>
            <button
              onClick={() => {
                setSelectedCategory("الكل");
                setSearch("");
              }}
            >
              عرض كل المنتجات
            </button>
          </div>
        )}
      </section>

      <section className="closing-note" id="newsletter">
        <div className="closing-leaf">✳</div>
        <span>مساحة أجمل، وحياة ألطف</span>
        <ArrowDown size={16} />
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#">
          <Image className="brand-mark" src="/logo.svg" width={28} height={28} alt="" />
          <span className="brand-name">
            بيت<span>.</span>
          </span>
        </a>
        <p>تفاصيل تصنع فرقًا.</p>
        <span>© بيت ٢٠٢٦ — صُنع بحب في السعودية</span>
      </footer>

      {notice && (
        <div className="toast">
          <Check size={17} />
          {notice}
        </div>
      )}

      {authOpen && (
        <div
          className="auth-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !authBusy) {
              setAuthOpen(false);
            }
          }}
        >
          <section className="auth-dialog" aria-label="تسجيل الدخول">
            <button
              className="panel-close auth-close"
              aria-label="إغلاق"
              onClick={() => setAuthOpen(false)}
              disabled={authBusy}
            >
              <X size={20} />
            </button>
            <a className="brand auth-brand" href="#">
              <Image className="brand-mark" src="/logo.svg" width={34} height={34} alt="" />
              <span className="brand-name">بيت<span>.</span></span>
            </a>
            <span className="eyebrow section-eyebrow"><span /> حسابك في بيت</span>
            <h2>{authMode === "register" ? "أهلًا بك،" : "سعيدون بعودتك،"}</h2>
            <p className="auth-intro">
              {authMode === "register"
                ? "أنشئ حسابك واحفظ اختياراتك أينما كنت."
                : "ادخل إلى حسابك وتابع اختياراتك."}
            </p>

            <form className="auth-form" onSubmit={(event) => void submitAuth(event)}>
              {authMode === "register" && (
                <label>
                  الاسم
                  <input name="name" type="text" autoComplete="name" minLength={2} maxLength={60} required />
                </label>
              )}
              <label>
                البريد الإلكتروني
                <input name="email" type="email" autoComplete="email" maxLength={254} required />
              </label>
              <label>
                كلمة المرور
                <input
                  name="password"
                  type="password"
                  autoComplete={authMode === "register" ? "new-password" : "current-password"}
                  minLength={authMode === "register" ? 6 : 1}
                  maxLength={128}
                  required
                />
                {authMode === "register" && <small>٦ أحرف على الأقل</small>}
              </label>
              {authError && <p className="auth-error" role="alert">{authError}</p>}
              <button className="checkout-button auth-submit" type="submit" disabled={authBusy}>
                {authBusy
                  ? "جارٍ التحقق..."
                  : authMode === "register"
                    ? "إنشاء حساب زبون"
                    : "تسجيل الدخول"}
                {!authBusy && <ArrowLeft size={17} />}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === "register" ? "لديك حساب؟" : "جديد في بيت؟"}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "register" ? "login" : "register");
                  setAuthError("");
                }}
              >
                {authMode === "register" ? "سجّل الدخول" : "أنشئ حساب زبون"}
              </button>
            </p>
          </section>
        </div>
      )}

      {panel && (
        <div
          className="panel-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPanel(null);
          }}
        >
          <aside
            className="side-panel"
            aria-label={panel === "cart" ? "حقيبة التسوق" : "المفضّلة"}
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow section-eyebrow">
                  <span /> {panel === "cart" ? "اختياراتك" : "احتفظ بها قريبًا"}
                </span>
                <h2>
                  {panel === "cart" ? "حقيبتي" : "المفضّلة"}{" "}
                  <em>({panel === "cart" ? cartCount : favorites.length})</em>
                </h2>
              </div>
              <button
                className="panel-close"
                aria-label="إغلاق"
                onClick={() => setPanel(null)}
              >
                <X size={21} />
              </button>
            </div>

            {panel === "cart" ? (
              <>
                <div className="panel-items">
                  {cart.length ? (
                    cart.map((item) => (
                      <div className="panel-item" key={item.productId}>
                        <div className="panel-product-image">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="88px"
                            unoptimized
                          />
                        </div>
                        <div className="panel-product-info">
                          <h3>{item.product.name}</h3>
                          <span>{currency.format(item.product.price)}</span>
                          <div className="quantity-control">
                            <button
                              aria-label="تقليل الكمية"
                              onClick={() =>
                                item.quantity > 1
                                  ? void updateQuantity(item, item.quantity - 1)
                                  : void removeFromCart(item.productId)
                              }
                            >
                              <Minus size={13} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              aria-label="زيادة الكمية"
                              disabled={
                                item.quantity >= Math.min(99, item.product.stock)
                              }
                              onClick={() =>
                                item.quantity <
                                  Math.min(99, item.product.stock) &&
                                void updateQuantity(item, item.quantity + 1)
                              }
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                        <button
                          className="remove-item"
                          aria-label={`حذف ${item.product.name}`}
                          onClick={() => void removeFromCart(item.productId)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <EmptyPanel
                      title="حقيبتك بانتظار شيء جميل"
                      text="أضف قطعة تحبها، وسنتكفّل بالباقي."
                    />
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="panel-summary">
                    <div>
                      <span>المجموع الفرعي</span>
                      <strong>{currency.format(subtotal)}</strong>
                    </div>
                    <small>الشحن يُحسب عند إتمام الطلب</small>
                    <button
                      className="checkout-button"
                      onClick={() =>
                        setNotice("قريبًا — نجهّز تجربة دفع جميلة لك")
                      }
                    >
                      إتمام الطلب <ArrowLeft size={17} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="panel-items favorites-items">
                {favorites.length ? (
                  favorites.map((product) => (
                    <div className="panel-item" key={product.id}>
                      <div className="panel-product-image">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="88px"
                          unoptimized
                        />
                      </div>
                      <div className="panel-product-info">
                        <h3>{product.name}</h3>
                        <span>{currency.format(product.price)}</span>
                        <button
                          className="favorite-add"
                          disabled={product.stock < 1}
                          onClick={() => void addToCart(product)}
                        >
                          {product.stock > 0 ? (
                            <>
                              <Plus size={14} /> أضف للحقيبة
                            </>
                          ) : (
                            "نفدت الكمية"
                          )}
                        </button>
                      </div>
                      <button
                        className="remove-item"
                        aria-label={`إزالة ${product.name} من المفضّلة`}
                        onClick={() => void removeFavorite(product.id)}
                      >
                        <Heart size={17} fill="currentColor" />
                      </button>
                    </div>
                  ))
                ) : (
                  <EmptyPanel
                    title="مساحتك المفضّلة فارغة"
                    text="احفظ القطع التي لفتت نظرك لتجدها هنا."
                  />
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="panel-empty">
      <span className="empty-icon">
        <ShoppingBag size={22} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
