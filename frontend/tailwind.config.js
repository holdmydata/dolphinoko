/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#FF6363',
        secondary: {
          100: '#E2E2D5',
          200: '#888883',
        },
        // Farm theme colors
        'farm-green': {
          DEFAULT: '#5D9C59',
          dark: '#4A7F48',
          light: '#8FB58A',
        },
        'farm-brown': {
          DEFAULT: '#7D5A50',
          dark: '#5F4339',
          light: '#A68778',
        },
        'farm-earth': {
          DEFAULT: '#B99470',
          light: '#E5D3B3',
          dark: '#8B6D4F',
        },
        'farm-blue': {
          DEFAULT: '#91C8E4',
          light: '#E0F4FF',
          dark: '#749BC2',
        },
        'farm-orange': '#F97B22',
        'farm-wood': {
          DEFAULT: '#C8AE7D',
          light: '#EBE3CC',
          dark: '#9F8A5C',
        },
        // Kawaii theme colors
        'kawaii-pink': {
          50: '#FFF5F9',
          100: '#FFE6F1',
          200: '#FFCCE3',
          300: '#FFA3CB',
          400: '#FF6BA9',
          500: '#FF3987',
          600: '#FF0564',
          700: '#CC0450',
          800: '#99033C',
          900: '#660228',
        },
        'kawaii-purple': {
          50: '#F8F5FF',
          100: '#F0EBFF',
          200: '#E0D6FF',
          300: '#C7B7FF',
          400: '#A68CFF',
          500: '#8A62FF',
          600: '#6B3AFF',
          700: '#5112FF',
          800: '#3800CF',
          900: '#26008F',
        },
        'kawaii-yellow': {
          50: '#FFFDF5',
          100: '#FFFBE6',
          200: '#FFF6CC',
          300: '#FFEE99',
          400: '#FFE266',
          500: '#FFD633',
          600: '#FFCC00',
          700: '#D9AD00',
          800: '#A68400',
          900: '#735C00',
        },
      },
      fontFamily: {
        'sans': ['Quicksand', 'ui-sans-serif', 'system-ui'],
        'body': ['Poppins', 'ui-sans-serif', 'system-ui'],
        'pixel': ['"Press Start 2P"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'pulse-soft': 'pulse 2s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}