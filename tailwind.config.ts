import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { 0: "#0a0814", 1: "#14101f", 2: "#1d1830", 3: "#2a2342" },
        accent: { DEFAULT: "#c4a3ff", cyan: "#6ee7ff", pink: "#ffb3d1" },
      },
    },
  },
  plugins: [],
};
export default config;
