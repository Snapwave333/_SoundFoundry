import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--color-bg))",
        "bg-elevated": "hsl(var(--color-bg-elevated))",
        surface: "hsl(var(--color-surface))",
        border: "hsl(var(--color-border))",
        "border-strong": "hsl(var(--color-border-strong))",
        fg: "hsl(var(--color-fg))",
        "fg-muted": "hsl(var(--color-fg-muted))",
        "fg-subtle": "hsl(var(--color-fg-subtle))",
        accent: "hsl(var(--color-accent))",
        "accent-hover": "hsl(var(--color-accent-hover))",
        "accent-muted": "hsl(var(--color-accent-muted))",
        positive: "hsl(var(--color-positive))",
        warning: "hsl(var(--color-warning))",
        danger: "hsl(var(--color-danger))",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-round)",
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        12: "var(--space-12)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      fontFamily: {
        sans: "var(--font-system)",
        mono: "var(--font-mono)",
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-md)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
      },
      transitionDuration: {
        fast: "120ms",
        normal: "200ms",
        slow: "350ms",
      },
      transitionTimingFunction: {
        "ease-out": "ease-out",
        "ease": "ease",
        "ease-in-out": "ease-in-out",
      },
      scale: {
        "node-hover": "var(--scale-node-hover)",
        "node-selected": "var(--scale-node-selected)",
      },
      opacity: {
        muted: "var(--opacity-muted)",
        disabled: "var(--opacity-disabled)",
      },
    },
  },
  plugins: [],
};

export default config;

