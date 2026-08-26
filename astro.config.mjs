// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sysarmortech.com',

  // Habilita Serverless / SSR
  output: 'server',

  redirects: {
    '/servicios': '/#servicios',
    
    // Redirecciones 301 para slugs de recursos que fueron renombrados
    '/recursos/implementacion-cuentas-dmsa-windows-2025': '/recursos/implementacion-cuentas-dmsa',
    '/recursos/hardening-correo-corporativo': '/recursos/hardening-correo-corporativo-m365',
  },

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
  ],
});