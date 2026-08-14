import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bento UI specific colors
        'bento-bg': '#F3F7F5', // Page background - soft tint off-white
        'bento-bg-dark': '#090D16', // Dark mode background
        'bento-primary': '#062D2D', // Primary accent - Deep Forest Teal
        'bento-white': '#FFFFFF', // Layout cards - Pure white
        'bento-card-dark': '#111827', // Dark mode card background
        'bento-sidebar-dark': '#0D131F', // Dark mode sidebar background
        
        // Pastel KPI Colors
        'bento-lime': '#D7F3B0', // Sales card - Soft Lime Green
        'bento-lime-text': '#1E3A00',
        'bento-mint': '#A2E8DD', // Categories card - Soft Mint Cyan
        'bento-mint-text': '#003830',
        'bento-pink': '#FBC0C0', // Expired card - Soft Pastel Pink
        'bento-pink-text': '#4A0D0D',
        'bento-lavender': '#CDC9FF', // Users card - Soft Lavender
        'bento-lavender-text': '#1B165C',
        
        // Supporting colors
        'bento-gray': '#E5E7EB',
        'bento-gray-dark': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Kantumruy Pro', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'Kantumruy Pro', 'sans-serif'],
        khmer: ['Kantumruy Pro', 'sans-serif'],
      },
      borderRadius: {
        'bento': '2rem', // 32px border radius for cards
        'pill': '9999px', // For pill-shaped buttons and inputs
      },
      boxShadow: {
        'bento': '0 2px 8px rgba(0, 0, 0, 0.08)', // Subtle floating shadow
      },
    },
  },
  plugins: [forms, typography],
};
export default config;
