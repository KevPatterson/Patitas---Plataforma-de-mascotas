/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta Patitas Anime Edition
        navy: {
          DEFAULT: '#1a2332',
          light: '#2a3650',
          dark: '#0f1621',
        },
        cream: {
          DEFAULT: '#fef8f0',
          dark: '#f5eee3',
        },
        orange: {
          DEFAULT: '#ff8c42',
          light: '#ffaa6f',
          dark: '#f56e20',
        },
        turquoise: {
          DEFAULT: '#4ecdc4',
          light: '#7eddd6',
          dark: '#3bb5ac',
        },
        purple: {
          DEFAULT: '#a78bfa',
          light: '#c4b5fd',
          dark: '#8b5cf6',
        },
        // Estados de mascotas
        lost: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
        found: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        adoption: {
          DEFAULT: '#a78bfa',
          light: '#c4b5fd',
          dark: '#8b5cf6',
        },
        // Legacy (compatibilidad)
        ink: '#1a2332',
        mamey: '#ff8c42',
        sol: '#ffc857',
        espuma: '#4ecdc4',
        arena: '#fef8f0',
        perdida: '#ef4444',
        encontrada: '#10b981',
        adopcion: '#a78bfa',
        // Shadcn tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        sans: ['Figtree', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        paw: 'var(--shadow-paw)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
        slower: 'var(--duration-slower)',
      },
      transitionTimingFunction: {
        smooth: 'var(--ease-smooth)',
        bounce: 'var(--ease-bounce)',
        soft: 'var(--ease-soft)',
      },
      animation: {
        'paw-bounce': 'paw-bounce 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'paw-pulse': 'paw-pulse 1.2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'fade-up': 'fade-up 0.6s var(--ease-smooth) forwards',
        'blob-morph': 'blob-morph 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
