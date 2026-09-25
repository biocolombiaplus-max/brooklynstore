import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Estos leen de variables CSS (definidas en globals.css) para poder
        // cambiarse en vivo desde /admin/configuracion sin recompilar.
        cream: 'rgb(var(--color-cream) / <alpha-value>)',
        'cream-alt': 'rgb(var(--color-cream-alt) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
        whatsapp: '#25D366',
        urgent: '#E2472D',
        gold: {
          50: '#FBF7EC',
          100: '#F4EACB',
          200: '#E9D59A',
          300: '#D9BE72',
          400: '#C9A646',
          500: '#B8923A',
          600: '#96742A',
          700: '#735820',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        btn: '999px',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(14, 14, 14, 0.07)',
        lift: '0 14px 34px rgba(184, 146, 58, 0.32)',
        dark: '0 14px 34px rgba(14, 14, 14, 0.28)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--color-primary) / 0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgb(var(--color-primary) / 0)' },
        },
        glowUrgent: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(226,71,45,0.45)' },
          '50%': { boxShadow: '0 0 0 9px rgba(226,71,45,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        attention: {
          '0%, 82%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '86%': { transform: 'scale(1.12) rotate(-6deg)' },
          '90%': { transform: 'scale(1.12) rotate(5deg)' },
          '94%': { transform: 'scale(1.08) rotate(-3deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.25', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        kenburns: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
        sparkle: {
          '0%': { transform: 'translateY(0) scale(0.6)', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { transform: 'translateY(-40px) scale(1.1)', opacity: '0' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        pulseSoft: 'pulseSoft 1.8s ease-in-out infinite',
        shimmer: 'shimmer 2.8s linear infinite',
        glow: 'glow 2.4s ease-in-out infinite',
        'glow-urgent': 'glowUrgent 2.4s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        popIn: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'spin-slow': 'spinSlow 7s linear infinite',
        attention: 'attention 5s ease-in-out infinite',
        twinkle: 'twinkle 1.4s ease-in-out infinite',
        sparkle: 'sparkle 1.2s ease-out infinite',
        slideUp: 'slideUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
        kenburns: 'kenburns 9s ease-out both',
        'marquee-slow': 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
