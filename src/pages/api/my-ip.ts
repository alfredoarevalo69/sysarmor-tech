// src/pages/api/my-ip.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    let clientIp = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);

    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1') {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      clientIp = ipData.ip;
    }

    let geo = {} as any;
    if (clientIp) {
      try {
        const geoRes = await fetch(`https://ipwho.is/${clientIp}`);
        if (geoRes.ok) {
          geo = await geoRes.json();
        }
      } catch (e) {
        // Fallback silencioso
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ipv4: clientIp || 'No disponible',
      ipv6: 'No disponible',
      country: geo.country || 'No disponible',
      country_code: geo.country_code || '',
      city: geo.city || '-',
      region: geo.region || '',
      org: geo.connection?.org || geo.connection?.isp || 'Desconocido',
      latitude: geo.latitude || '-',
      longitude: geo.longitude || '-'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Error al procesar la solicitud' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};