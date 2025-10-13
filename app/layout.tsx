import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { AchievementNotificationProvider } from '@/components/AchievementNotificationProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ayansh Math Prep',
  description: 'Practice math problems for AMC8, MOEMS, and Math Kangaroo competitions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <AchievementNotificationProvider />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            success: {
              style: {
                background: '#10b981',
                color: '#fff',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
