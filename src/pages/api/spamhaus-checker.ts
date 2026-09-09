// src/pages/api/spamhaus-checker.ts
import type { APIRoute } from 'astro';
import dns from 'dns/promises';

const spamhausReasons: Record<string, { list: string; desc: string; delistUrl: string }> = {
  '127.0.0.2': { list: 'SBL', desc: 'Spamhaus SBL - IP o bloque listado por enviar spam o fuentes de spam directo.', delistUrl: 'https://www.spamhaus.org/sbl/' },
  '127.0.0.3': { list: 'SBL CSS', desc: 'Spamhaus SBL CSS - Emisor de spam detectado mediante análisis automatizado.', delistUrl: 'https://www.spamhaus.org/query/css' },
  '127.0.0.4': { list: 'XBL Exploits', desc: 'Spamhaus XBL - Servidor comprometido, troyano o proxy abierto expuesto.', delistUrl: 'https://www.spamhaus.org/xbl/' },
  '127.0.0.5': { list: 'XBL Exploits', desc: 'Spamhaus XBL - Proxy abierto detectado.', delistUrl: 'https://www.spamhaus.org/xbl/' },
  '127.0.0.6': { list: 'XBL Exploits', desc: 'Spamhaus XBL - Proxy abierto / Ala de worm detectada.', delistUrl: 'https://www.spamhaus.org/xbl/' },
  '127.0.0.7': { list: 'XBL Exploits', desc: 'Spamhaus XBL - C&C (Command & Control) o malware activo.', delistUrl: 'https://www.spamhaus.org/xbl/' },
  '127.0.0.10': { list: 'PBL', desc: 'Spamhaus PBL - IP residencial o dinámica no autorizada para enviar correo directo sin SMTP relay.', delistUrl: 'https://www.spamhaus.org/pbl/' },
  '127.0.0.11': { list: 'PBL', desc: 'Spamhaus PBL - Rango de IP asignado a ISP de banda ancha.', delistUrl: 'https://www.spamhaus.org/pbl/' }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return new Response(JSON.stringify({ error: 'El dominio es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const dqsKey = import.meta.env.SPAMHAUS_DQS_KEY;
    if (!dqsKey) {
      return new Response(JSON.stringify({ error: 'Clave DQS no configurada en el servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0];
    const queryZone = `${cleanDomain}.${dqsKey}.zen.dq.spamhaus.net`;

    let isListed = false;
    let returnCodes: string[] = [];
    let diagnostics: any[] = [];

    try {
      const addresses = await dns.resolve4(queryZone);
      if (addresses && addresses.length > 0) {
        isListed = true;
        returnCodes = addresses;
        diagnostics = addresses.map(ip => ({
          ip,
          info: spamhausReasons[ip] || { list: 'Desconocido / ZEN', desc: 'Código de bloqueo general de Spamhaus', delistUrl: 'https://www.spamhaus.org/lookup/' }
        }));
      }
    } catch (dnsError: any) {
      // ENOTFOUND significa que el dominio no está listado (comportamiento normal y esperado para dominios limpios)
      if (dnsError.code !== 'ENOTFOUND') {
        console.error('Error en consulta DNS Spamhaus DQS:', dnsError);
      }
    }

    return new Response(JSON.stringify({
      domain: cleanDomain,
      listed: isListed,
      codes: returnCodes,
      diagnostics,
      provider: 'Spamhaus Data Query Service (DQS)'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno al procesar la solicitud' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};