import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "كرسي هارموني",
    description: "كرسي بتصميم انسيابي وخشب طبيعي يضيف لمسة دافئة لأي مساحة.",
    price: 1290000,
    category: "أثاث",
    image:
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=85",
    badge: "الأكثر مبيعًا",
  },
  {
    name: "مصباح لونا",
    description: "إضاءة محيطية ناعمة بهيكل معدني أنيق ولمسة عصرية.",
    price: 480000,
    category: "إضاءة",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
    badge: "وصل حديثًا",
  },
  {
    name: "مزهرية سيراميك",
    description: "قطعة مصنوعة يدويًا بتفاصيل هادئة وتدرجات لونية طبيعية.",
    price: 220000,
    category: "ديكور",
    image:
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "طاولة سول",
    description: "طاولة جانبية صغيرة تجمع بين الخشب الفاتح والخطوط البسيطة.",
    price: 860000,
    category: "أثاث",
    image:
      "https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "مرآة أرك",
    description: "مرآة بإطار ناعم تضفي اتساعًا وأناقة على مدخل المنزل.",
    price: 590000,
    category: "ديكور",
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85",
    badge: "اختيارنا",
  },
  {
    name: "مصباح مكتب نورد",
    description: "إضاءة عملية بتصميم اسكندنافي هادئ لمساحة عمل ملهمة.",
    price: 350000,
    category: "إضاءة",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "كرسي رتان",
    description: "كرسي خفيف من الرتان الطبيعي، مثالي للزوايا الهادئة.",
    price: 970000,
    category: "أثاث",
    image:
      "https://images.unsplash.com/photo-1598300056393-4aac492f4344?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "وعاء ستون",
    description: "وعاء ديكوري بملمس حجري طبيعي يكمل جمال رفوفك.",
    price: 175000,
    category: "ديكور",
    image:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "كنبة سكون",
    description: "كنبة مريحة بخطوط بسيطة وقماش ناعم يليق بغرفة المعيشة.",
    price: 4850000,
    category: "أثاث",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85",
    badge: "وصل حديثًا",
  },
  {
    name: "طاولة قهوة ريف",
    description: "طاولة قهوة من خشب طبيعي بتفاصيل هادئة وعملية.",
    price: 1240000,
    category: "أثاث",
    image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "مكتبة أفق",
    description: "رفوف مفتوحة بتصميم خفيف لترتيب كتبك وقطعك المفضلة.",
    price: 1780000,
    category: "أثاث",
    image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "كرسي استرخاء ندى",
    description: "كرسي بقماش كتاني ومسند مريح لركن القراءة المفضل.",
    price: 2150000,
    category: "أثاث",
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=85",
    badge: "اختيارنا",
  },
  {
    name: "مصباح أرضي ضياء",
    description: "مصباح أرضي بوهج دافئ يهيئ أجواء هادئة في المساء.",
    price: 790000,
    category: "إضاءة",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "مصباح معلّق مدار",
    description: "مصباح معلّق بظل طبيعي يضيف لمسة مميزة لطاولة الطعام.",
    price: 640000,
    category: "إضاءة",
    image: "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=900&q=85",
    badge: "وصل حديثًا",
  },
  {
    name: "طقم شموع وهج",
    description: "شموع بروائح لطيفة وألوان هادئة للحظات الاسترخاء.",
    price: 195000,
    category: "ديكور",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "لوحة تلال",
    description: "لوحة فنية بألوان ترابية تمنح جدارك شخصية دافئة.",
    price: 430000,
    category: "ديكور",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "مرآة شمس",
    description: "مرآة دائرية بإطار أنيق لتفاصيل مدخل البيت.",
    price: 720000,
    category: "ديكور",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "وسادة غيمة",
    description: "وسادة قطنية ناعمة بألوان محايدة لراحة يومية.",
    price: 145000,
    category: "ديكور",
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85",
    badge: "الأكثر مبيعًا",
  },
  {
    name: "سجادة رمل",
    description: "سجادة بنقشة بسيطة وملمس ناعم تكمل دفء مساحتك.",
    price: 1150000,
    category: "ديكور",
    image: "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "صينية ضيافة زيتون",
    description: "صينية من خشب الزيتون بتفاصيل طبيعية للضيافة اليومية.",
    price: 285000,
    category: "ديكور",
    image: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "ساعة حائط وقت",
    description: "ساعة حائط بتصميم بسيط يساعد على اكتمال تفاصيل المكان.",
    price: 375000,
    category: "ديكور",
    image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "طقم أكواب طين",
    description: "أكواب سيراميك بتشطيب يدوي لفنجان قهوتك اليومي.",
    price: 165000,
    category: "ديكور",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "مزهرية قمر",
    description: "مزهرية زجاجية أنيقة للزهور الموسمية أو كقطعة مستقلة.",
    price: 245000,
    category: "ديكور",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
  {
    name: "مقعد بوم",
    description: "مقعد جانبي أنيق بتفاصيل خشبية ولمسة عملية للمساحات الصغيرة.",
    price: 560000,
    category: "أثاث",
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=85",
    badge: null,
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (Boolean(adminEmail) !== Boolean(adminPassword)) {
    throw new Error(
      "Set both ADMIN_EMAIL and ADMIN_PASSWORD to configure the admin account.",
    );
  }
  if (
    adminEmail &&
    adminPassword &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminPassword.length < 6)
  ) {
    throw new Error(
      "Use a valid ADMIN_EMAIL and an ADMIN_PASSWORD with at least 6 characters.",
    );
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products.`);

  if (adminEmail && adminPassword) {
    const { hashPassword } = await import("../lib/password");
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { name: "مدير المتجر", passwordHash, role: "ADMIN" },
      create: {
        name: "مدير المتجر",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log("Admin account configured.");
  }
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed products:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
