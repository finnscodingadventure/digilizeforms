/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6366f1',
                    dark: '#4f46e5',
                    light: '#818cf8',
                },
                dark: {
                    DEFAULT: '#1e1e2d',
                    lighter: '#2d2d3a',
                    light: '#252533',
                    card: '#1a1a27',
                },
                "digilize-brand": "#4f46e5",
            },
            borderRadius: {
                DEFAULT: '0.5rem',
            },
        },
    },
    plugins: [],
}
