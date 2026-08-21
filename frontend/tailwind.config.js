/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          fg: 'var(--primary-fg)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          bg: 'var(--muted-bg)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        price: {
          DEFAULT: 'var(--price)',
          was: 'var(--price-was)',
        },
        ring: 'var(--accent)',
        star: 'var(--star)',
        'product-stage': 'var(--product-stage)',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        spec: ['"IBM Plex Sans"', 'Inter', 'ui-monospace', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '600' }],
        h1: ['clamp(2.25rem, 4vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '600' }],
        h2: ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      maxWidth: {
        store: '1280px',
        admin: '1440px',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      transitionDuration: {
        200: '200ms',
        250: '250ms',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'sheet-overlay-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'sheet-overlay-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'sheet-right-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'sheet-right-out': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(100%)' } },
        'sheet-left-in': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'sheet-left-out': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-100%)' } },
        'sheet-bottom-in': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'sheet-bottom-out': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(100%)' } },
        'sheet-top-in': { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(0)' } },
        'sheet-top-out': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-100%)' } },
        'popup-overlay-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'popup-overlay-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'popup-in': {
          from: { opacity: '0', transform: 'translate(-50%, calc(-50% + 18px))' },
          to: { opacity: '1', transform: 'translate(-50%, -50%)' },
        },
        'popup-out': {
          from: { opacity: '1', transform: 'translate(-50%, -50%)' },
          to: { opacity: '0', transform: 'translate(-50%, calc(-50% + 12px))' },
        },
        'popup-swap': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'sheet-overlay-in': 'sheet-overlay-in 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'sheet-overlay-out': 'sheet-overlay-out 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'sheet-right-in': 'sheet-right-in 0.22s cubic-bezier(0.2, 0, 0, 1)',
        'sheet-right-out': 'sheet-right-out 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'sheet-left-in': 'sheet-left-in 0.22s cubic-bezier(0.2, 0, 0, 1)',
        'sheet-left-out': 'sheet-left-out 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'sheet-bottom-in': 'sheet-bottom-in 0.22s cubic-bezier(0.2, 0, 0, 1)',
        'sheet-bottom-out': 'sheet-bottom-out 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'sheet-top-in': 'sheet-top-in 0.22s cubic-bezier(0.2, 0, 0, 1)',
        'sheet-top-out': 'sheet-top-out 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'popup-overlay-in': 'popup-overlay-in 0.22s cubic-bezier(0.2, 0, 0, 1)',
        'popup-overlay-out': 'popup-overlay-out 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'popup-in': 'popup-in 0.24s cubic-bezier(0.2, 0, 0, 1)',
        'popup-out': 'popup-out 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'popup-swap': 'popup-swap 0.22s cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};
