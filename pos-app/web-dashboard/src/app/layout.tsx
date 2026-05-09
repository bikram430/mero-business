import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mero Business — Merchant Dashboard',
  description: 'Manage your business, track sales, send receipts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ne">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F3F4F6' }}>
        {children}
      </body>
    </html>
  );
}
