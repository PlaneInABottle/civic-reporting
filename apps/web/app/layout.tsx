import type { Metadata } from 'next';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Civic Reporting — synthetic pilot',
    template: '%s | Civic Reporting',
  },
  description:
    'A fictional local pilot for reporting non-emergency public-space issues.',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
