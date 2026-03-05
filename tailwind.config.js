/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'factory-dark': '#1F2937',
                'assembly-line': '#374151',
                'high-tech': '#1E3A8A',
                'primary-blue': '#3B82F6',
                'secondary-green': '#10B981',
                'accent-amber': '#F59E0B',
            },
            animation: {
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
                    '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)' },
                },
                'bounce-subtle': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
            },
        },
    },
    plugins: [],
}

