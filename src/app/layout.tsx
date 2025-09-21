import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Navigation } from "@/components/ui/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ayansh Math Competition Prep",
  description: "Personal math competition preparation app for AMC 8, MOEMS, and Math Kangaroo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navigation />
            <main>
              {children}
            </main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}