import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedNexus",
  description: "Divina architectura pro studiis medicis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <title>MedNexus</title>
      </head>
      <body className="min-h-full flex flex-col bg-[#050505] text-[#E0E0E0] font-serif relative overflow-x-hidden">
        {/* UNIVERSAL TEXTURE LAYER */}
        <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

        {/* CONTENT LAYER */}
        <div className="relative z-10 flex-grow">
          {children}
        </div>

      </body>
    </html>
  );
}
