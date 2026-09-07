// src/pages/api/my-ip.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const [resV4, resV6] = await Promise.allSettled([
      fetch('https://api.ipify.org?format=json').then(r => r.json()),
      fetch('https://api64.ipify.org?format=json').then(r => r.json())
    ]);

    const ipv4 = resV4.status === 'fulfilled' ? resV4.value.ip : null;
    const v6Val = resV6.status === 'fulfilled' ? resV6.value.ip : null;
    const ipv6 = (v6Val && v6Val.includes(':')) ? v6Val : 'No disponible';

    let geo = {} as any;
    if (ipv4) {
      try {
        const geoRes = await fetch(`https://ipwho.is/${ipv4}`);
        geo = await geoRes.json();
      } catch (e) {
        // Fallback en caso de error en geolocalización
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ipv4: ipv4 || 'No disponible',
      ipv6: ipv6,
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
    return new Response(JSON.stringify({ success: false, error: 'Error al consultar servicios' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};