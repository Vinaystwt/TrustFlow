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
        // New premium-fintech palette
        bg: '#0B0E1A',
        'bg-elevated': '#131829',
        'bg-subtle': '#1A2138',
        border: '#242C45',
        'border-strong': '#2F3A5A',
        'brand-primary': '#6366F1',
        'brand-primary-light': '#818CF8',
        'brand-primary-dark': '#4F46E5',
        'accent-blue': '#3B82F6',
        'accent-purple': '#A855F7',
        'accent-pink': '#EC4899',
        'accent-cyan': '#06B6D4',
        'accent-amber': '#F59E0B',
        'accent-emerald': '#10B981',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-dim': '#64748B',

        // Legacy tokens kept so unrevamped views keep working
        'trust-base': '#0B0E1A',
        'trust-surface': '#131829',
        'trust-surface-hover': '#1A2138',
        'trust-border': '#242C45',
        'trust-accent': '#6366F1',
        'trust-accent-hover': '#4F46E5',
        'trust-progress': '#10B981',
        'trust-warning': '#F59E0B',
        'trust-danger': '#EF4444',
        'trust-text': '#F1F5F9',
        'trust-text-secondary': '#94A3B8',
        'trust-text-dim': '#64748B',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        card: '16px',
      },
      backgroundImage: {
        'gradient-hero':
          'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
        'gradient-trust': 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
        'gradient-section-1':
          'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 60%)',
        'gradient-section-2':
          'radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.12), transparent 60%)',
        'gradient-section-3':
          'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.1), transparent 60%)',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.18)',
        lift: '0 8px 30px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.3)',
        glow: '0 0 40px rgba(99,102,241,0.25)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
