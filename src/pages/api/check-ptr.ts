// src/pages/api/check-ptr.ts
import type { APIRoute } from 'astro';

const getReverseIpQuery = (ip: string): string | null => {
  if (ip.includes('.')) {
    // IPv4: ej. 8.8.8.8 -> 8.8.8.8.in-addr.arpa
    const parts = ip.split('.').reverse();
    if (parts.length !== 4) return null;
    return `${parts.join('.')}.in-addr.arpa`;
  } else if (ip.includes(':')) {
    // IPv6: expansión estándar y reverso para .ip6.arpa
    try {
      let fullIp = ip;
      if (ip.includes('::')) {
        const sides = ip.split('::');
        const left = sides[0] ? sides[0].split(':') : [];
        const right = sides[1] ? sides[1].split(':') : [];
        const missing = 8 - (left.length + right.length);
        const zeros = Array(missing).fill('0');
        const expanded = [...left, ...zeros, ...right];
        fullIp = expanded.map(o => o.padStart(4, '0')).join('');
      } else {
        fullIp = ip.split(':').map(o => o.padStart(4, '0')).join('');
      }
      const nibbles = fullIp.replace(/:/g, '').split('').reverse();
      return `${nibbles.join('.')}.ip6.arpa`;
    } catch {
      return null;
    }
  }
  return null;
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const ip = url.searchParams.get('ip')?.trim();

  if (!ip) {
    return new Response(JSON.stringify({ error: 'Falta el parámetro IP' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const reverseQuery = getReverseIpQuery(ip);
  if (!reverseQuery) {
    return new Response(JSON.stringify({
      ip,
      ptr: 'Formato de IP inválido',
      status: 'Error: La dirección IP no tiene un formato IPv4 o IPv6 válido.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Consulta segura mediante HTTPS a Cloudflare DNS over HTTPS (DoH)
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(reverseQuery)}&type=PTR`;
    const response = await fetch(dohUrl, {
      headers: { 'Accept': 'application/dns-json' }
    });

    const data = await response.json();
    let ptr = 'No se encontró registro PTR';
    let statusMsg = 'Sin registro PTR configurado';

    if (data.Answer && data.Answer.length > 0) {
      const rawPtr = data.Answer.find((ans: any) => ans.type === 12)?.data || data.Answer[0].data;
      ptr = rawPtr.endsWith('.') ? rawPtr.slice(0, -1) : rawPtr;
      statusMsg = 'Validado correctamente (Registro PTR activo)';
    }

    return new Response(JSON.stringify({
      ip,
      ptr,
      status: statusMsg
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      ip,
      ptr: 'Error de red',
      status: `No se pudo conectar con el servicio de resolución: ${error.message || 'Desconocido'}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};