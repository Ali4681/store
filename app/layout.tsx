import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "بيت | تفاصيل تصنع فرقًا",
  description: "اكتشف قطعًا مختارة بعناية لتجعل من منزلك مساحة تشبهك.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
