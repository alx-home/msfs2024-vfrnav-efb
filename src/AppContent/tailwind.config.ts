import type { Config } from "tailwindcss";
import container_queries from '@tailwindcss/container-queries';

import { PluginAPI } from "tailwindcss/types/config";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [
    ({ addVariant }: PluginAPI) => {
      addVariant('hocus', ['&:hover', '&:focus']);
      addVariant('hocus-within', ['&:hover', '&:focus-within']);
      addVariant('group-hocus', [
        ':merge(.group):hover &',
        ':merge(.group):focus &'
      ]);
      addVariant('group-hocus-within', [
        ':merge(.group):hover &',
        ':merge(.group):focus-within &'
      ]);
      addVariant('peer-hocus', [
        ':merge(.peer):hover ~ &',
        ':merge(.peer):focus ~ &'
      ]);
      addVariant('peer-hocus-within', [
        ':merge(.peer):hover ~ &',
        ':merge(.peer):focus-within ~ &'
      ]);
    },
    container_queries
  ],
} satisfies Config;
