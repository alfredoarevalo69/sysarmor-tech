// src/pages/api/spf.ts
import type { APIRoute } from 'astro';
import { Resolver } from 'dns/promises';

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

export const GET: APIRoute = async ({ url }) => {
  const domain = url.searchParams.get('domain')?.trim().toLowerCase();
  
  if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
    return new Response(JSON.stringify({ success: false, error: 'Dominio inválido' }), { status: 400 });
  }

  try {
    const txtRecords = await resolver.resolveTxt(domain);
    const flattenedTxt = txtRecords.map(record => record.join(''));
    const spfRecord = flattenedTxt.find(record => record.toLowerCase().startsWith('v=spf1'));

    if (!spfRecord) {
      return new Response(JSON.stringify({
        success: true,
        found: false,
        message: `El dominio '${domain}' no cuenta con un registro SPF (TXT) configurado.`
      }), { status: { 'Content-Type': 'application/json' } } as any);
    }

    // Contar los mecanismos que consumen lookups DNS según RFC 7208: include, a, mx, ptr, redirect, exists
    const mechanisms = spfRecord.split(/\s+/);
    let lookupCount = 0;
    
    mechanisms.forEach(mech => {
      const lower = mech.toLowerCase();
      if (
        lower.startsWith('include:') ||
        lower.startsWith('a:') || lower === 'a' ||
        lower.startsWith('mx:') || lower === 'mx' ||
        lower.startsWith('ptr:') || lower === 'ptr' ||
        lower.startsWith('redirect:') ||
        lower.startsWith('exists:')
      ) {
        lookupCount++;
      }
    });

    return new Response(JSON.stringify({
      success: true,
      found: true,
      record: spfRecord,
      lookupCount,
      exceedsLimit: lookupCount > 10
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: true,
      found: false,
      message: `No se pudieron recuperar los registros TXT para '${domain}'.`
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};