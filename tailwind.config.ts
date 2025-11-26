import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
  		fontFamily: {
  			sans: [
  				'Inter',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif',
  				'Apple Color Emoji',
  				'Segoe UI Emoji',
  				'Segoe UI Symbol',
  				'Noto Color Emoji'
  			],
  			rounded: [
  				'SF Pro Rounded',
  				'Inter',
  				'sans-serif'
  			],
  			serif: [
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		},
  		fontSize: {
  			h1: [
  				'2.125rem',
  				{
  					lineHeight: '2.5rem',
  					fontWeight: '700'
  				}
  			],
  			h2: [
  				'1.75rem',
  				{
  					lineHeight: '2.25rem',
  					fontWeight: '600'
  				}
  			],
  			h3: [
  				'1.375rem',
  				{
  					lineHeight: '1.875rem',
  					fontWeight: '600'
  				}
  			],
  			body: [
  				'1.0625rem',
  				{
  					lineHeight: '1.625rem',
  					fontWeight: '400'
  				}
  			],
  			caption: [
  				'0.8125rem',
  				{
  					lineHeight: '1.125rem',
  					fontWeight: '500'
  				}
  			]
  		},
  		spacing: {
  			'1': '0.25rem',
  			'2': '0.5rem',
  			'3': '0.75rem',
  			'4': '1rem',
  			'6': '1.5rem',
  			'8': '2rem'
  		},
  		colors: {
  			'accent-teal': 'hsl(var(--accent-teal))',
  			'accent-teal-alt': 'hsl(var(--accent-teal-alt))',
  			ink: 'hsl(var(--ink))',
  			'ink-muted': 'hsl(var(--ink-muted))',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
  		borderRadius: {
  			card: '1.5rem',
  			sheet: '2rem',
  			control: '0.875rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		backgroundImage: {
			glass: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.08) 0%, hsla(0, 0%, 100%, 0.04) 100%)',
			'ultra-thin': 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.05) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
			'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))'
		},
  		boxShadow: {
  			glass: '0 8px 32px rgba(0, 0, 0, 0.12)',
  			'glow-teal': '0 0 40px hsla(189, 77%, 44%, 0.3)'
  		},
  		backdropBlur: {
  			glass: '24px'
  		},
  		transitionDuration: {
  			standard: '180ms',
  			context: '380ms',
  			chart: '700ms'
  		},
  		transitionTimingFunction: {
  			'ease-out': 'cubic-bezier(0.2, 0, 0.2, 1)',
  			spring: 'cubic-bezier(0.33, 1, 0.68, 1)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			},
  			parallax: {
  				'0%': {
  					transform: 'translateY(0px)'
  				},
  				'100%': {
  					transform: 'translateY(-10px)'
  				}
  			},
  			'scale-in': {
  				from: {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				to: {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'glow-pulse': {
  				'0%, 100%': {
  					opacity: '0.5',
  					boxShadow: '0 0 20px hsla(189, 77%, 44%, 0.3)'
  				},
  				'50%': {
  					opacity: '1',
  					boxShadow: '0 0 40px hsla(189, 77%, 44%, 0.5)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 180ms ease-out',
  			'accordion-up': 'accordion-up 180ms ease-out',
  			'fade-in': 'fade-in 240ms ease-out',
  			shimmer: 'shimmer 2.5s linear infinite',
  			parallax: 'parallax 1s ease-out',
  			'scale-in': 'scale-in 240ms cubic-bezier(0.33, 1, 0.68, 1)',
  			'glow-pulse': 'glow-pulse 2s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
