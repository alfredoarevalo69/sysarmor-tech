// src/pages/api/check-dmarc.ts
import type { APIRoute } from 'astro';
import dns from 'dns/promises';

// Forzar servidores DNS públicos y confiables (Google / Cloudflare)
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return new Response(JSON.stringify({ error: 'El dominio es requerido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanDomain = domain.trim().toLowerCase();
    let dmarcStatus = 'FAIL';
    let dmarcRecord = '';
    let dmarcQname = `_dmarc.${cleanDomain}`;

    let currentDomainParts = cleanDomain.split('.');
    let dmarcFound = false;

    // Cascada ascendente hacia el dominio raíz (Apex)
    while (currentDomainParts.length >= 2 && !dmarcFound) {
      const testDomain = currentDomainParts.join('.');
      const testQname = `_dmarc.${testDomain}`;

      try {
        const records = await dns.resolveTxt(testQname);
        const flatRecord = records.map(chunk => chunk.join('')).join('');
        
        if (flatRecord.toUpperCase().includes('V=DMARC1')) {
          dmarcRecord = flatRecord;
          dmarcQname = testQname;
          dmarcStatus = 'PASS';
          dmarcFound = true;
          break;
        }
      } catch {
        // No existe registro en este nivel, subimos al siguiente
      }

      currentDomainParts.shift();
    }

    return new Response(JSON.stringify({
      status: dmarcStatus,
      record: dmarcRecord,
      qname: dmarcQname
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error general en check-dmarc:', error);
    return new Response(JSON.stringify({ error: 'Error interno en la consulta DNS.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};