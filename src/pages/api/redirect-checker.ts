// src/pages/api/redirect-checker.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    let targetUrl = body.url?.trim();

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'La URL es requerida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const hops = [];
    let currentUrl = targetUrl;
    let maxRedirects = 10;
    let redirectCount = 0;

    while (redirectCount < maxRedirects) {
      const startTime = performance.now();
      
      // Realizamos el fetch controlando las redirecciones manualmente
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      hops.push({
        url: currentUrl,
        status: response.status,
        statusText: response.statusText || 'OK',
        responseTime,
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) break;

        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
      } else {
        break;
      }
    }

    return new Response(JSON.stringify({ hops }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    // Imprimimos el error real en la consola de la terminal de Node.js para que lo veas
    console.error('Error detallado en redirect-checker:', err);

    return new Response(JSON.stringify({ 
      error: `Error técnico: ${err.message || 'Desconocido'}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};