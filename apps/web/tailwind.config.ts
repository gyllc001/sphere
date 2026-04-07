import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Indigo
        indigo: {
          50: '#EEF2FF',
          600: '#4F46E5',
          700: '#4338CA',
        },
        // Secondary — Cyan
        cyan: {
          50: '#ECFEFF',
          400: '#22D3EE',
          500: '#06B6D4',
        },
        // Accent — Amber
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
        },
        // Neutrals
        gray: {
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          600: '#4B5563',
          800: '#1F2937',
          950: '#0F0F1A',
        },
        // Dark mode surfaces
        surface: {
          base: '#0B0B14',
          raised: '#13131F',
          overlay: '#1C1C2E',
          border: '#2A2A3C',
        },
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1.15', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
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
