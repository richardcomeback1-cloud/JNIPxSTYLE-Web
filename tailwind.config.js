/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#FBF3F0',
          100: '#F7EDE6',
          200: '#F1D9CF',
          300: '#E5B8A8',
          400: '#D6A191',
          500: '#C98B7D',
          600: '#B57466',
          700: '#9C5E52',
          800: '#7E4B42',
          900: '#6E5B4E',
        },
        taupe: {
          50: '#F7EDE6',
          100: '#EFE0D6',
          200: '#D9C3B5',
          300: '#BFA08E',
          400: '#9C8A7C',
          500: '#6E5B4E',
          600: '#5C4B40',
          700: '#4A3D34',
          800: '#3A2F28',
          900: '#2A221E',
        },
        cream: '#F7EDE6',
        accent: '#F1D9CF',
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Prompt"', 'Georgia', 'serif'],
        sans: ['"Prompt"', 'system-ui', 'sans-serif'],
        prompt: ['"Prompt"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-up': 'fadeUp 0.7s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
