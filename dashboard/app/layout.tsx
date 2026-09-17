import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

// Barlow Condensed dipilih karena bentuknya mirip huruf pada papan
// petunjuk halte dan bus. Inter dipakai untuk teks dan angka agar mudah dibaca.
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TransJakarta App Review Analytics",
  description:
    "Pemantauan review aplikasi TransJakarta di Google Play, diklasifikasikan otomatis dengan IndoBERT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${barlow.variable} ${inter.variable}`}>
      <body className="font-sans">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
