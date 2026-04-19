import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kapitalen AI',
  description: 'Få raske analyser av aksjer og krypto',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  );
}
