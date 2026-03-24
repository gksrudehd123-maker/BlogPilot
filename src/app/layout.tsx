import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BlogPilot',
  description: 'AI 기반 다중 플랫폼 블로그 자동화 시스템',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
