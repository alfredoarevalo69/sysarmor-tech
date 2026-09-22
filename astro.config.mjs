// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://sysarmortech.com',
  output: 'server',

  // Sin redirecciones automáticas que afecten las herramientas
  redirects: {},

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['nodemailer'],
    },
    build: {
      rollupOptions: {
        external: ['nodemailer'],
      },
    },
  },

  adapter: vercel(),
  integrations: [
    sitemap(),
    preact({
      include: ['**/preact/*'],
    }),
    react({
      include: ['**/components/RedirectAnalyzer.jsx', '**/components/react/*'],
    }),
  ],
});