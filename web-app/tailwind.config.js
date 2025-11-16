/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // OnlyCats カラーパレット（福祉系の優しい雰囲気）
        primary: {
          50: '#FEF5F0',
          100: '#FDE8DD',
          200: '#FBD1BB',
          300: '#F9BA99',
          400: '#F8A377',
          500: '#F6C7A6',  // メインカラー（パステルサーモン）
          600: '#F4A070',
          700: '#F28958',
          800: '#F07240',
          900: '#EE5B28',
        },
        secondary: {
          50: '#F0FAF4',
          100: '#E1F5E9',
          200: '#CDE7D6',  // ミントグリーン
          300: '#B9D9C3',
          400: '#A5CBB0',
          500: '#91BD9D',
          600: '#7DAF8A',
          700: '#69A177',
          800: '#559364',
          900: '#418551',
        },
        accent: {
          50: '#F7F5FD',
          100: '#EFEBFB',
          200: '#E7E1F9',
          300: '#DFD7F7',
          400: '#D9D4F1',  // パステルラベンダー
          500: '#C9C0ED',
          600: '#B9ACE9',
          700: '#A998E5',
          800: '#9984E1',
          900: '#8970DD',
        },
        cream: {
          50: '#FFFCF7',
          100: '#FFF7ED',  // クリームホワイト（背景）
          200: '#FFF2E3',
          300: '#FFEDD9',
          400: '#FFE8CF',
          500: '#FFE3C5',
          600: '#FFDEBB',
          700: '#FFD9B1',
          800: '#FFD4A7',
          900: '#FFCF9D',
        },
        highlight: {
          50: '#FEFBF2',
          100: '#FDF7E5',
          200: '#FCF3D8',
          300: '#FBEFCB',
          400: '#FAEBBA',
          500: '#F8E8A1',  // カスタードイエロー（通知・バッジ）
          600: '#F7E488',
          700: '#F6E06F',
          800: '#F5DC56',
          900: '#F4D83D',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
        ],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(246, 199, 166, 0.15)',
        'card-hover': '0 4px 16px rgba(246, 199, 166, 0.25)',
        'modal': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
