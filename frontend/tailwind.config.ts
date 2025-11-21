import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          base: '#02030A',
          panel: '#090f1d',
          overlay: '#0d1528',
          accent: '#22F2AA',
          indigo: '#7C3AED',
          gold: '#FACC15',
          muted: '#9CA3AF',
        }
      },
      fontFamily: {
        'display': ['var(--font-display)', 'Space Grotesk', 'Sora', 'system-ui', 'sans-serif'],
        'body': ['var(--font-body)', 'DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'arena-gradient': 'radial-gradient(circle at 10% 20%, rgba(34, 242, 170, 0.08), transparent 25%), radial-gradient(circle at 85% 12%, rgba(124, 58, 237, 0.10), transparent 28%), linear-gradient(135deg, #02030A 0%, #060b19 45%, #050a17 100%)',
        'arena-grid': 'linear-gradient(rgba(34, 242, 170, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.08) 1px, transparent 1px)',
        'arena-noise': 'radial-gradient(circle at 30% 50%, rgba(250, 204, 21, 0.06), transparent 22%), radial-gradient(circle at 80% 70%, rgba(124, 58, 237, 0.06), transparent 20%)',
      },
      backgroundSize: {
        'grid': '42px 42px',
      },
      animation: {
        'grid-flow': 'grid-flow 20s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'pulse-border': 'pulse-border 3s ease-in-out infinite',
        'shine': 'shine 6s linear infinite',
      },
      keyframes: {
        'grid-flow': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '50px 50px' }
        },
        'glow': {
          'from': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
          'to': { boxShadow: '0 0 30px rgba(16, 185, 129, 0.6)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-border': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 242, 170, 0.18)' },
          '50%': { boxShadow: '0 0 0 8px rgba(124, 58, 237, 0.09)' }
        },
        'shine': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
export default config
