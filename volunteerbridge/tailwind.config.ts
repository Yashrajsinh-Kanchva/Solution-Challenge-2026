const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#59623c",
        "primary-container": "#ccd6a6",
        "on-primary-container": "#171e01",
        "secondary": "#5a623f",
        "secondary-container": "#dce4b8",
        "on-secondary-container": "#181e03",
        "surface": "#fcf9f3",
        "background": "#fcf9f3",
        "surface-variant": "#f0eee8",
        "outline": "#ccd6a6",
        "error": "#ba1a1a",
        "on-surface": "#1c1c18",
        "on-surface-variant": "#46483e"
      },
      borderRadius: {
        "modern": "16px",
        "button": "12px"
      },
      fontFamily: {
        "sans": ["Public Sans", "sans-serif"]
      }
    },
  },
  plugins: [],
};

export default config;
