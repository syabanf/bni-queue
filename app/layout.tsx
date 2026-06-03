import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BNI NatCon Digital Passport",
  description: "Digital passport, stamp, and engagement platform for BNI National Conference.",
};

// Runs before paint to apply the saved theme (no flash of the wrong theme).
const themeInit = `try{if(localStorage.getItem('bni-theme')==='light')document.documentElement.classList.add('light')}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full bg-wit-black text-wit-white">{children}</body>
    </html>
  );
}
