// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import react from '@astrojs/react';

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
    // Configuramos Preact para que maneje sus propios componentes (si los usas en otra ruta)
    preact({
      include: ['**/preact/*'], // O ajusta la ruta donde tengas tus componentes de Preact
    }),
    // Configuramos React para que se encargue exclusivamente de este nuevo analizador o su carpeta
    react({
      include: ['**/components/RedirectAnalyzer.jsx', '**/components/react/*'],
    }),
  ],
});