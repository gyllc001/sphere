import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';
import PostHogProvider from '@/components/PostHogProvider';
import { NpsSurveyWidget } from '@/components/NpsSurvey';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

// Runs before hydration to set the `dark` class on <html>. Defaults to dark
// unless localStorage explicitly says otherwise. Inlined so it can run before
// the first paint and avoid a flash.
const FOUC_SCRIPT = `
(function(){try{var t=localStorage.getItem('sphere.theme');var d=document.documentElement;if(t==='light'){d.classList.remove('dark')}else{d.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();
`;

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
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} font-sans dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body className="bg-base text-primary">
        <Suspense>
          <PostHogProvider>
            {children}
            <NpsSurveyWidget />
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
