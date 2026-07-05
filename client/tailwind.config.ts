/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Game palette
        realm: {
          bg: '#0a0a1a',
          surface: '#12122a',
          card: '#1a1a3a',
          border: '#2a2a5a',
          accent: '#6c63ff',
          'accent-light': '#8b83ff',
          gold: '#ffd700',
          'gold-dim': '#b8960a',
          hp: '#e85d5d',
          mana: '#5d8be8',
          xp: '#5de88b',
          rarity: {
            common: '#9ca3af',
            uncommon: '#22c55e',
            rare: '#3b82f6',
            epic: '#a855f7',
            legendary: '#f97316',
          },
        },
      },
      fontFamily: {
        game: ['Cinzel', 'serif'],
        ui: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-realm': 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(108,99,255,0.1) 0%, rgba(0,0,0,0) 100%)',
        'gradient-gold': 'linear-gradient(135deg, #ffd700 0%, #b8960a 100%)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(108, 99, 255, 0.3)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-hp': '0 0 15px rgba(232, 93, 93, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
