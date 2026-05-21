/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'traffic-red': '#EF4444',
        'warning-amber': '#F59E0B',
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'sos-pulse': 'sos-pulse 2s ease-in-out infinite',
        'cpr-beat': 'cpr-beat 0.6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'sos-pulse': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 40px 20px rgba(239, 68, 68, 0.35)' },
        },
        'cpr-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.35)' },
        },
      },
    },
  },
  plugins: [],
}
