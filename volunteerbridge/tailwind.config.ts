const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand — olive green
        "primary":               "#4D5A2C",
        "primary-hover":         "#647A39",
        "primary-container":     "#EEF3D2",
        "on-primary-container":  "#1A1C15",
        // Secondary
        "secondary":             "#404535",
        "secondary-container":   "#C8D68A",
        "on-secondary-container":"#1A1C15",
        // Backgrounds
        "surface":               "#FFFFFF",
        "surface-2":             "#FAFAF7",
        "surface-variant":       "#EFECE3",
        "background":            "#F7F5EE",
        "outline":               "#D4DCA8",
        "outline-light":         "#E8EDD0",
        // Text
        "on-surface":            "#1A1C15",
        "on-surface-variant":    "#404535",
        "muted":                 "#6B7160",
        // Status
        "error":                 "#A81919",
        "error-container":       "#FDECEA",
        "success":               "#2E6B32",
        "success-container":     "#EAF5EB",
        "warning":               "#92540A",
        "warning-container":     "#FEF6E7",
        "info":                  "#1B5E99",
        "info-container":        "#E8F2FC",
      },
      borderRadius: {
        "modern": "14px",
        "button": "10px",
        "pill":   "999px",
      },
      fontFamily: {
        "sans": ["Public Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card":   "0 1px 3px rgba(45,55,20,0.06), 0 6px 20px rgba(45,55,20,0.08)",
        "md":     "0 2px 8px rgba(45,55,20,0.08), 0 8px 24px rgba(45,55,20,0.09)",
        "lg":     "0 4px 16px rgba(45,55,20,0.08), 0 20px 48px rgba(45,55,20,0.12)",
        "btn":    "0 4px 14px rgba(77,90,44,0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
