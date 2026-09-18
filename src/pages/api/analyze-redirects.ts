import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'La URL es requerida' }), { status: 400 });
    }

    let currentUrl = url;
    const hops = [];
    let maxHops = 10; // Límite de seguridad contra bucles infinitos
    let finalUrl = currentUrl;

    while (maxHops > 0) {
      const startTime = performance.now();
      let response;

      try {
        // Configuramos fetch para que NO siga las redirecciones automáticamente y podamos capturar los códigos 3xx
        response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'SysArmorTech-RedirectAnalyzer/1.0 (+https://sysarmortech.com)'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: `No se pudo conectar a la URL: ${currentUrl}` }), { status: 400 });
      }

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      const status = response.status;
      const location = response.headers.get('location');

      hops.push({
        url: currentUrl,
        status,
        latency
      });

      // Si es un código de redirección y existe un header 'location'
      if (status >= 300 && status < 400 && location) {
        // Resolver URLs relativas si las hubiera
        currentUrl = new URL(location, currentUrl).toString();
        finalUrl = currentUrl;
        maxHops--;
      } else {
        finalUrl = currentUrl;
        break;
      }
    }

    return new Response(JSON.stringify({ finalUrl, hops }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno al procesar el análisis' }), { status: 500 });
  }
};