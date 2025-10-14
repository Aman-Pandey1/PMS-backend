export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                // KKD brand palette
                brand: {
                    DEFAULT: '#C89A6A', // accent
                    dark: '#1E1F20',
                    light: '#E0B88B',
                    contrast: '#FFFFFF',
                },
                amber: {
                    50: '#F7F7F6',
                    100: '#EEEDEB',
                    200: '#D8CFC4',
                    300: '#C89A6A', // replaced to match KKD accent
                    400: '#C89A6A',
                    500: '#B3845A',
                    600: '#9C724E',
                    700: '#1E1F20', // use near-black for strong surfaces
                    800: '#151617',
                    900: '#0E0F10',
                },
            },
        },
    },
    plugins: [],
};