import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
	darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "672px",   // 42rem
				"3xl": "768px",   // 48rem
				"4xl": "896px",   // 56rem
				"5xl": "1024px",  // 64rem
				"6xl": "1152px",  // 72rem
				"7xl": "1280px",  // 80rem
			}
		},
		extend: {
			colors: {
				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				},
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
        		},
			},
			borderRadius: {
				xl: "calc(var(--radius) + 4px)",
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			fontFamily: {
				sans: [...fontFamily.sans]
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--bits-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--bits-accordion-content-height)" },
					to: { height: "0" },
				},
				"caret-blink": {
					"0%,70%,100%": { opacity: "1" },
					"20%,50%": { opacity: "0" },
				},
				"fade-in": {
					from: { opacity: "0" },
					to: { opacity: "1" },
				},
				"fade-in-delayed": {
					"0%": { opacity: "0" },
					"50%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				'text-slide-2': {
					'0%, 40%': {
						transform: 'translateY(0%)',
					},
					'50%, 90%': {
						transform: 'translateY(-33.33%)',
					},
					'100%': {
						transform: 'translateY(-66.66%)',
					},
				},
				'text-slide-3': {
					'0%, 26.66%': {
						transform: 'translateY(0%)',
					},
					'33.33%, 60%': {
						transform: 'translateY(-25%)',
					},
					'66.66%, 93.33%': {
						transform: 'translateY(-50%)',
					},
					'100%': {
						transform: 'translateY(-75%)',
					},
				},
				'text-slide-4': {
					'0%, 20%': {
						transform: 'translateY(0%)',
					},
					'25%, 45%': {
						transform: 'translateY(-20%)',
					},
					'50%, 70%': {
						transform: 'translateY(-40%)',
					},
					'75%, 95%': {
						transform: 'translateY(-60%)',
					},                            
					'100%': {
						transform: 'translateY(-80%)',
					},
				},
				'text-slide-5': {
					'0%, 16%': {
						transform: 'translateY(0%)',
					},
					'20%, 36%': {
						transform: 'translateY(-16.66%)',
					},
					'40%, 56%': {
						transform: 'translateY(-33.33%)',
					},
					'60%, 76%': {
						transform: 'translateY(-50%)',
					},
					'80%, 96%': {
						transform: 'translateY(-66.66%)',
					},
					'100%': {
						transform: 'translateY(-83.33%)',
					},
				},
				'text-slide-6': {
					'0%, 13.33%': {
						transform: 'translateY(0%)',
					},
					'16.66%, 30%': {
						transform: 'translateY(-14.28%)',
					},
					'33.33%, 46.66%': {
						transform: 'translateY(-28.57%)',
					},
					'50%, 63.33%': {
						transform: 'translateY(-42.85%)',
					},
					'66.66%, 80%': {
						transform: 'translateY(-57.14%)',
					},
					'83.33%, 96.66%': {
						transform: 'translateY(-71.42%)',
					},
					'100%': {
						transform: 'translateY(-85.71%)',
					},
				},
				'text-slide-7': {
					'0%, 11.43%': {
						transform: 'translateY(0%)',
					},
					'14.28%, 25.71%': {
						transform: 'translateY(-12.5%)',
					},
					'28.57%, 40%': {
						transform: 'translateY(-25%)',
					},
					'42.85%, 54.28%': {
						transform: 'translateY(-37.5%)',
					},
					'57.14%, 68.57%': {
						transform: 'translateY(-50%)',
					},
					'71.42%, 82.85%': {
						transform: 'translateY(-62.5%)',
					},
					'85.71%, 97.14%': {
						transform: 'translateY(-75%)',
					},
					'100%': {
						transform: 'translateY(-87.5%)',
					},
				},
				'text-slide-8': {
					'0%, 10%': {
						transform: 'translateY(0%)',
						'margin-right': '-0.5em',
					},
					'12.5%, 22.5%': {
						transform: 'translateY(-11.11%)',
						'margin-right': '-0.09em',
					},
					'25%, 35%': {
						transform: 'translateY(-22.22%)',
						'margin-right': '-0.06em',
					},
					'37.5%, 47.5%': {
						transform: 'translateY(-33.33%)',
						'margin-right': '-0.5em',
					},
					'50%, 60%': {
						transform: 'translateY(-44.44%)',
						'margin-right': '-0.5em',
					},
					'62.5%, 72.5%': {
						transform: 'translateY(-55.55%)',
						'margin-right': '-0.5em',
					},
					'75%, 85%': {
						transform: 'translateY(-66.66%)',
						'margin-right': '-0.5em',
					},
					'87.5%, 97.5%': {
						transform: 'translateY(-77.77%)',
						'margin-right': '-0.4em',
					},
					'100%': {
						transform: 'translateY(-88.88%)',
						'margin-right': '-0.5em',
					},
				}
			},
			animation: {
        		"accordion-down": "accordion-down 0.2s ease-out",
        		"accordion-up": "accordion-up 0.2s ease-out",
       			"caret-blink": "caret-blink 1.25s ease-out infinite",
				"fade-in": "fade-in 0.3s ease-out",
				"fade-in-delayed": "fade-in-delayed 0.6s ease-out",
				'text-slide-2': 'text-slide-2 5s cubic-bezier(0.83, 0, 0.17, 1) infinite',
				'text-slide-3': 'text-slide-3 7.5s cubic-bezier(0.83, 0, 0.17, 1) infinite',
				'text-slide-4': 'text-slide-4 10s cubic-bezier(0.83, 0, 0.17, 1) infinite',
				'text-slide-5': 'text-slide-5 12.5s cubic-bezier(0.83, 0, 0.17, 1) infinite',
				'text-slide-6': 'text-slide-6 15s cubic-bezier(0.83, 0, 0.17, 1) infinite',
				'text-slide-7': 'text-slide-7 17.5s cubic-bezier(0.83, 0, 0.17, 1) infinite',
				'text-slide-8': 'text-slide-8 20s cubic-bezier(0.83, 0, 0.17, 1) infinite',
      		},
		},
	},
	plugins: [tailwindcssAnimate],
};

export default config;
