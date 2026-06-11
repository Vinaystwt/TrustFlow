import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'trust-base': '#0A1628',
        'trust-surface': '#111D33',
        'trust-surface-hover': '#162440',
        'trust-border': '#1E3050',
        'trust-accent': '#3B82F6',
        'trust-accent-hover': '#2563EB',
        'trust-progress': '#10B981',
        'trust-warning': '#F59E0B',
        'trust-danger': '#EF4444',
        'trust-text': '#E2E8F0',
        'trust-text-secondary': '#94A3B8',
        'trust-text-dim': '#64748B',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}

export default config
