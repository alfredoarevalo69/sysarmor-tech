// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { getCollection } from 'astro:content';

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
    sitemap({
      async customPages() {
        // Obtiene todos los documentos de tu colección de recursos
        const recursos = await getCollection('recursos');
        
        // Mapea cada archivo a su URL completa correspondiente
        return recursos.map((post) => `https://sysarmortech.com/recursos/${post.slug}`);
      },
    }),
  ],
});