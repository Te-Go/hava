/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./shared/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                'ice-blue': '#eff6ff',
                'glass-white': 'rgba(255, 255, 255, 0.65)',
                'glass-border': 'rgba(255, 255, 255, 0.4)',
                'deep-navy': '#0f172a',
                'tedder-blue': '#3b82f6',
                'dark-glass': 'rgba(15, 23, 42, 0.65)',
                'dark-border': 'rgba(255, 255, 255, 0.1)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            }
        }
    },
    plugins: [],
}
