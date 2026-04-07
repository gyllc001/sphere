import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sphere — Connect Brands with Communities',
  description:
    'Sphere is the marketplace where ambitious brands find engaged communities. Authentic partnerships at scale.',
  openGraph: {
    title: 'Sphere — Connect Brands with Communities',
    description:
      'Sphere is the marketplace where ambitious brands find engaged communities. Authentic partnerships at scale.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
