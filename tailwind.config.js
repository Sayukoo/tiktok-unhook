/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{html,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tiktok: {
          dark: '#121212',
          card: '#1e1e1e',
          cardLight: '#ffffff',
          border: '#2f2f2f',
          borderLight: '#e5e7eb',
          cyan: '#25F4EE',
          magenta: '#FE2C55',
          text: '#ffffff',
          muted: '#8a8b91',
          mutedLight: '#6b7280',
          hover: '#292929',
          hoverLight: '#f3f4f6',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'tiktok-glow': '0 0 15px rgba(37, 244, 238, 0.3), 0 0 15px rgba(254, 44, 85, 0.3)',
      }
    },
  },
  plugins: [],
}
