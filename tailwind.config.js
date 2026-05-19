import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'San Francisco',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        bg: {
          base: '#0B0E13',
          elevated: '#11151C',
          card: '#161B24',
          hover: '#1C2230',
        },
        border: {
          subtle: '#1F2632',
          strong: '#2A3242',
        },
        text: {
          primary: '#F5F7FA',
          secondary: '#9AA3B2',
          muted: '#6B7280',
        },
        brand: {
          DEFAULT: '#2D7FF9',
          dim: '#1E5BBE',
          glow: '#4A95FF',
        },
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
        glow: '0 0 0 1px rgba(45,127,249,0.4), 0 8px 28px -8px rgba(45,127,249,0.4)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
