import type { Metadata } from "next";
import { Amiri, Reem_Kufi, Scheherazade_New } from "next/font/google";
import "./globals.css";

const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-amiri", display: "swap" });
const reemKufi = Reem_Kufi({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-reem", display: "swap" });
const scheherazade = Scheherazade_New({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-scheherazade", display: "swap" });

export const metadata: Metadata = {
  title: "استوديو صورة إلى 3D — مولّد نماذج ثلاثية الأبعاد بالذكاء الاصطناعي",
  description: "حوّل أي صورة إلى نموذج 3D احترافي. تصدير متعدد الجودات، تحرير في المتصفح، texture PBR.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${reemKufi.variable} ${scheherazade.variable}`}>
      <body>{children}</body>
    </html>
  );
}
