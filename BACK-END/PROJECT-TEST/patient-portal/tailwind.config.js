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
                // Healthcare dark theme - deeper, more professional colors
                primary: {
                    50: '#e6f1ff',
                    100: '#b3d4ff',
                    200: '#80b8ff',
                    300: '#4d9bff',
                    400: '#1a7eff',
                    500: '#0066e6',
                    600: '#0052b3',
                    700: '#003d80',
                    800: '#00294d',
                    900: '#00141a',
                },
                secondary: {
                    50: '#e6fff9',
                    100: '#b3ffef',
                    200: '#80ffe5',
                    300: '#4dffdb',
                    400: '#1affd1',
                    500: '#00e6b8',
                    600: '#00b38f',
                    700: '#008066',
                    800: '#004d3d',
                    900: '#001a14',
                },
                dark: {
                    100: '#1e293b',
                    200: '#1a2234',
                    300: '#151b29',
                    400: '#10141f',
                    500: '#0a0d14',
                    600: '#050709',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
