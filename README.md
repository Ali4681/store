# بيت — متجر ديكور منزلي

متجر عربي متجاوب مبني بـ Next.js. يجمع عرض ٢٤ منتجًا والبحث والتصنيفات والسلة والمفضّلة وتسجيل دخول الزبائن والمدير وإدارة المنتجات والمخزون في تطبيق واحد، مع واجهات API في Next.js وقاعدة PostgreSQL عبر Prisma. تنتقل السلة والمفضّلة من جلسة الزائر إلى حسابه عند تسجيل الدخول. الأسعار معروضة بالليرة السورية.

## المتطلبات

- Node.js 20 أو أحدث
- PostgreSQL 14 أو أحدث

## التشغيل

1. ثبّت الحزم:

   ```bash
   npm install
   ```

2. أنشئ قاعدة PostgreSQL باسم `bayt_store`، وانسخ `.env.example` إلى `.env` ثم حدّث بيانات الاتصال في `DATABASE_URL`. اضبط بريد المدير وكلمة مروره (٦ محارف على الأقل) في `ADMIN_EMAIL` و`ADMIN_PASSWORD`. استخدم كلمة مرور قوية، ولا تستخدم القيم التجريبية في بيئة الإنتاج.

3. أنشئ الجداول وأضف المنتجات التجريبية وحساب المدير:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

تسجيل الزبائن متاح من واجهة المتجر، أما حساب المدير فيُنشأ من إعدادات البيئة عند تشغيل seed ولا يمكن إنشاؤه عبر التسجيل العام. يحتوي seed على ٢٤ قطعة، وتشغيله مرة أخرى يحدّثها دون تكرارها.

4. شغّل التطبيق:

   ```bash
   npm run dev
   ```

افتح [http://localhost:3000](http://localhost:3000).

## واجهات API

- `GET /api/products` — عرض المنتجات.
- `GET /api/cart?sessionId=...` — قراءة السلة.
- `POST /api/cart` — إضافة منتج للسلة (`sessionId`, `productId`).
- `PATCH /api/cart` — تحديث كمية منتج (`sessionId`, `productId`, `quantity`).
- `DELETE /api/cart?sessionId=...&productId=...` — حذف منتج، أو حذف كل عناصر السلة عند عدم تمرير `productId`.
- `GET /api/favorites?sessionId=...` — قراءة المفضّلة.
- `POST /api/favorites` — حفظ منتج (`sessionId`, `productId`).
- `DELETE /api/favorites?sessionId=...&productId=...` — إزالة منتج من المفضّلة.
- `POST /api/auth/register` — إنشاء حساب زبون (`name`, `email`, `password`, `sessionId`).
- `POST /api/auth/login` — تسجيل الدخول (`email`, `password`, `sessionId`)؛ يحدد الخادم صلاحية الحساب من قاعدة البيانات.
- `GET /api/auth/me` — قراءة الحساب الحالي.
- `POST /api/auth/logout` — إنهاء الجلسة.
- `/api/admin/products` — للمدير فقط: `POST` لإضافة منتج، `PATCH?id=...` لتعديل بياناته، و`DELETE?id=...` لحذفه. يدعم المنتج الاسم والوصف والتصنيف والصورة والشارة والسعر والكمية المتوفرة.

تجربة إتمام الدفع غير مفعّلة؛ المتجر مخصص لعرض المنتجات وإدارة السلة والمفضّلة.
