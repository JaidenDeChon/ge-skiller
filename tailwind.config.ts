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
				'text-slide': {
                    '0%, 16%': {
                        transform: 'translateY(0%)',
						'margin-right': '-0.42em',
                    },
                    '20%, 36%': {
                        transform: 'translateY(-16.66%)',
						'margin-right': '0',
                    },
                    '40%, 56%': {
                        transform: 'translateY(-33.33%)',
						'margin-right': '-0.42em',
                    },
                    '60%, 76%': {
                        transform: 'translateY(-50%)',
						'margin-right': '0',
                    },
                    '80%, 96%': {
                        transform: 'translateY(-66.66%)',
						'margin-right': '-0.5em',
                    },
                    '100%': {
                        transform: 'translateY(-83.33%)',
						'margin-right': '-0.42em',
                    },
                },
			},
			animation: {
        		"accordion-down": "accordion-down 0.2s ease-out",
        		"accordion-up": "accordion-up 0.2s ease-out",
       			"caret-blink": "caret-blink 1.25s ease-out infinite",
				"fade-in": "fade-in 0.3s ease-out",
				"fade-in-delayed": "fade-in-delayed 0.6s ease-out",
				'text-slide': 'text-slide 9s cubic-bezier(0.83, 0, 0.17, 1) infinite',
      		},
		},
	},
	plugins: [tailwindcssAnimate],
};

export default config;
