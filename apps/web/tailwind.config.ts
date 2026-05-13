import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Sphere design system (Step 9 part 1) ─────────────────────
      //
      // Tokens are wired through CSS variables in apps/web/src/app/globals.css
      // (:root for light theme, .dark for dark theme). The toggle ships in
      // Step 9 part 2; the wiring is in place now so flipping a single class
      // on <html> recolors the app without touching JSX.
      //
      // We intentionally split tokens across backgroundColor / textColor /
      // borderColor / ringColor instead of dumping them all into `colors`.
      // A top-level `colors.base` would collide with Tailwind's `text-base`
      // font-size default (text-* utilities pull from both fontSize AND
      // textColor). The split keeps utility names semantic AND collision-free.
      backgroundColor: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-subtle)',
        muted: 'var(--bg-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        sidebar: 'var(--sidebar-bg)',
        'sidebar-hover': 'var(--sidebar-item-hover)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        accent: 'var(--accent)',
        'accent-text': 'var(--accent-text)',
        sidebar: 'var(--sidebar-text)',
        'sidebar-active': 'var(--sidebar-text-active)',
      },
      borderColor: {
        default: 'var(--border-default)',
        strong: 'var(--border-strong)',
        accent: 'var(--accent)',
        sidebar: 'var(--sidebar-border)',
      },
      ringColor: {
        accent: 'var(--accent)',
      },
      // Keep legacy color buckets so the marketing/brand/community pages
      // continue to compile until they're ported in Step 9 part 2.
      colors: {
        indigo: {
          50: '#EEF2FF',
          600: '#4F46E5',
          700: '#4338CA',
        },
        cyan: {
          50: '#ECFEFF',
          400: '#22D3EE',
          500: '#06B6D4',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
        },
        gray: {
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          600: '#4B5563',
          800: '#1F2937',
          950: '#0F0F1A',
        },
        surface: {
          base: '#0B0B14',
          raised: '#13131F',
          overlay: '#1C1C2E',
          border: '#2A2A3C',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#34D399',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#FCD34D',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#F87171',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#60A5FA',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Sphere typography scale.
        // text-* utilities only set size/leading/weight/tracking — combine
        // with `font-display` or `font-sans` to pick the family.
        'display-1': [
          '56px',
          { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.03em' },
        ],
        'display-2': [
          '40px',
          { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.02em' },
        ],
        h2: [
          '30px',
          { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' },
        ],
        h3: ['22px', { lineHeight: '1.3', fontWeight: '500' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.01em' }],
        label: ['11px', { lineHeight: '1.2', fontWeight: '500', letterSpacing: '0.06em' }],
        // Legacy display scale (kept for marketing pages).
        'display-2xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1.15', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }],
      },
      borderRadius: {
        // Per the design language we override Tailwind's defaults.
        sm: 'var(--radius-sm)', // 6px
        md: 'var(--radius-md)', // 10px
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        24: '96px',
      },
      transitionTimingFunction: {
        'spring-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        fast: '100ms',
        DEFAULT: '200ms',
        medium: '300ms',
        slow: '400ms',
      },
    },
  },
  plugins: [],
};

export default config;
