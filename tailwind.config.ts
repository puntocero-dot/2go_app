import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        // Identidad cálida "taller de madera" — alineada con el login y con
        // los nombres originales de estos tokens (madera-natural, terracota),
        // que un rediseño anterior había remapeado a cian/violeta genérico.
        "cyber-cyan": "#2db28c",
        "cyber-cyan-light": "#7ddebf",
        "deep-space": "#120e0a",
        "space-navy": "#171310",

        "negro-azabache": "#14100c",
        "gris-pizarra": "#241d17",
        "deep-navy": "#1a140d",
        "vibrant-cyan": "#2db28c",
        "electric-coral": "#f87171",

        "madera-natural": "#c17f45",
        "beige-arena": "#d9c4a3",
        "gris-nube": "#8a8177",
        "marron-tierra": "#6b4423",
        "terracota": "#d97757",

        // CSS variable tokens (Shadcn)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(45, 178, 140, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(45, 178, 140, 0.6)" },
        },
      },
      animation: {
        in: "slide-in-from-right 0.3s ease-out",
        "gradient-shift": "gradient-shift 4s ease infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        "cyan-glow": "radial-gradient(ellipse at center, rgba(45,178,140,0.15) 0%, transparent 70%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
