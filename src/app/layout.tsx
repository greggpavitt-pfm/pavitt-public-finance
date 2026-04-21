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
  title: "Pavitt Public Finance — International PFM Expert",
  description:
    "Gregg Pavitt brings 25+ years of public financial management expertise to governments and organizations across Sub-Saharan Africa, South Asia, and the Pacific.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* No-JS fallback: reveal-on-scroll sections are hidden by default via CSS;
            this ensures they're visible for users without JavaScript. */}
        <noscript>
          <style>{`.reveal-on-scroll { opacity: 1 !important; transform: none !important; transition: none !important; }`}</style>
        </noscript>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
