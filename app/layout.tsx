import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
  Chivo_Mono,
} from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
});

const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenie - KRW Stablecoin Infra",
  description:
    "Zenie by ELYSIA enables KRW stablecoin issuance through simple KRW transfers using a zkTLS-based WebProof infrastructure tailored to Korea’s regulatory landscape.",

  manifest: "/site.webmanifest",
  themeColor: "#0074e5",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakartaSans.variable} ${chivoMono.variable} antialiased`}
      >
        <Header />
        <Providers>
          <div className="pt-[calc(64px+36px+70px)] max-sm:pt-[calc(64px+36px+30px)]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
