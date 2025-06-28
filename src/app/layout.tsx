import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Data Alchemist",
  description: "AI-powered data cleaning and rule management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster
          richColors
          theme="light"
          position="top-right"
          className="toaster group"
          toastOptions={{
            style: {
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              color: 'black',
            },
            className: 'text-black',
          }}
        />
      </body>
    </html>
  );
}
