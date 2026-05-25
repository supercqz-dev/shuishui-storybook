import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '水水的绘本',
  description: '给水水的私人定制绘本故事',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
