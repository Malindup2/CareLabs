import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import FloatingChatbot from "@/components/FloatingChatbot";
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
  title: "CareLabs",
  description: "Next Generation Healthcare Platform",
  icons: {
    icon: "/images/carelabs.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-[family-name:var(--font-geist-sans)]`}
        suppressHydrationWarning
      >
        {children}
        {/* Floating AI Symptom Checker Chatbot */}
        <FloatingChatbot />
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#F8FAFC',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#F8FAFC',
            },
          },
        }} />
      </body>
    </html>
  );
}
