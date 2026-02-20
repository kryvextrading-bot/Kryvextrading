import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				/* Binance Official Colors */
				binance: {
					yellow: '#F0B90B',
					'yellow-dark': '#DBA40A',
					'yellow-light': '#FCD535',
					'yellow-bg': 'rgba(240, 185, 11, 0.1)',
					black: '#0B0E11',
					dark: '#1E2329',
					card: '#2B3139',
					'card-hover': '#373B42',
					border: '#3A3F4A',
				},
				/* Text Colors */
				text: {
					primary: '#EAECEF',
					secondary: '#B7BDC6',
					tertiary: '#848E9C',
					disabled: '#5E6673',
				},
				/* Accent Colors */
				green: {
					primary: '#0ECB81',
					dark: '#0FB37E',
					bg: 'rgba(14, 203, 129, 0.1)',
				},
				red: {
					primary: '#F6465D',
					dark: '#D63F53',
					bg: 'rgba(246, 70, 93, 0.1)',
				},
				blue: {
					primary: '#5096FF',
					dark: '#4785E6',
					bg: 'rgba(80, 150, 255, 0.1)',
				},
				purple: {
					primary: '#A66AE6',
					dark: '#955FD1',
					bg: 'rgba(166, 106, 230, 0.1)',
				},
				orange: {
					primary: '#F78D4B',
					dark: '#E67F44',
					bg: 'rgba(247, 141, 75, 0.1)',
				},
				/* Legacy compatibility */
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#F0B90B',
					foreground: '#0B0E11',
					glow: 'hsl(var(--primary-glow))',
					dark: 'hsl(var(--primary-dark))'
				},
				secondary: {
					DEFAULT: '#2B3139',
					foreground: '#EAECEF'
				},
				success: {
					DEFAULT: '#0ECB81',
					foreground: '#0B0E11',
				},
				destructive: {
					DEFAULT: '#F6465D',
					foreground: '#fff',
				},
				muted: {
					DEFAULT: '#2B3139',
					foreground: '#848E9C'
				},
				accent: {
					DEFAULT: '#2B3139',
					foreground: '#F0B90B',
				},
				popover: {
					DEFAULT: '#1E2329',
					foreground: '#EAECEF'
				},
				card: {
					DEFAULT: '#1E2329',
					foreground: '#EAECEF'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
			},
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
				mono: ['Inter Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
			},
			fontSize: {
				'xs': ['12px', { lineHeight: '16px' }],
				'sm': ['14px', { lineHeight: '20px' }],
				'base': ['16px', { lineHeight: '24px' }],
				'lg': ['18px', { lineHeight: '28px' }],
				'xl': ['20px', { lineHeight: '28px' }],
				'2xl': ['24px', { lineHeight: '32px' }],
				'3xl': ['30px', { lineHeight: '36px' }],
				'4xl': ['36px', { lineHeight: '40px' }],
			},
			backgroundImage: {
				'gradient-gold': 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
				'gradient-green': 'linear-gradient(135deg, #0ECB81 0%, #0FB37E 100%)',
				'gradient-red': 'linear-gradient(135deg, #F6465D 0%, #D63F53 100%)',
				'gradient-blue': 'linear-gradient(135deg, #5096FF 0%, #4785E6 100%)',
				'gradient-card': 'linear-gradient(180deg, #1E2329 0%, #2B3139 100%)',
				'gradient-dark': 'linear-gradient(135deg, #0B0E11 0%, #1E2329 100%)',
			},
			boxShadow: {
				'elegant': '0 10px 30px -10px rgba(240, 185, 11, 0.3)',
				'glow': '0 0 40px rgba(240, 185, 11, 0.2)',
				'card': '0 4px 20px rgba(11, 14, 17, 0.3)',
				'binance': '0 4px 12px rgba(0, 0, 0, 0.15)',
			},
			borderRadius: {
				lg: '0.75rem',
				md: '0.5rem',
				sm: '0.25rem'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' },
				},
				'slideUp': {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'slideDown': {
					'0%': { transform: 'translateY(-100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'shimmer': {
					'0%': { transform: 'translateX(-100%) skewX(-12deg)' },
					'100%': { transform: 'translateX(200%) skewX(-12deg)' },
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'slide-up': 'slideUp 0.3s ease-out',
				'slide-down': 'slideDown 0.3s ease-out',
				'shimmer': 'shimmer 2s infinite linear',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
			transitionDuration: {
				'fast': '150ms',
				'base': '300ms',
				'slow': '500ms',
			},
			transitionTimingFunction: {
				'default': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
				'in': 'cubic-bezier(0.4, 0.0, 1, 1)',
				'out': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
				'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
