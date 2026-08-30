/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#FDF6EA',
        surface: '#FFFFFF',
        surface2: '#FBF2E1',
        surface3: '#F7E4BE',
        border: '#E8D9BC',
        borderSoft: '#F1E6CE',
        text: '#2A211A',
        textDim: '#6E6252',
        textFaint: '#9C8F78',
        brand: '#E2726B',
        brandStrong: '#EA8B85',
        brandInk: '#FFF8F4',
        brandDim: '#F7DAD6',
        open: '#7CA36B',
        warn: '#D9A23A',
        crit: '#C94F49',
        route: '#6C93A8',
        clay: '#B97A4E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '20px',
        md: '14px',
        sm: '10px',
      },
    },
  },
  plugins: [],
};
