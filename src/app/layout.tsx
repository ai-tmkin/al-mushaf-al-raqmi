import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Amiri, Scheherazade_New } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

const scheherazade = Scheherazade_New({
  variable: "--font-scheherazade",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "المصحف الرقمي | تصميم الآيات القرآنية",
  description:
    "أداة مجانية لتخصيص وتصميم الآيات القرآنية بخطوط عربية أصيلة وخلفيات جمالية، مع الحفاظ الكامل على قدسية النص القرآني.",
  keywords: [
    "القرآن الكريم",
    "تصميم آيات",
    "المصحف الرقمي",
    "خطوط عربية",
    "Quran",
    "Islamic design",
  ],
  authors: [{ name: "المصحف الرقمي" }],
  openGraph: {
    title: "المصحف الرقمي | تصميم الآيات القرآنية",
    description:
      "أداة مجانية لتخصيص وتصميم الآيات القرآنية بخطوط عربية أصيلة وخلفيات جمالية",
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body
        className={`${ibmPlexArabic.variable} ${amiri.variable} ${scheherazade.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
