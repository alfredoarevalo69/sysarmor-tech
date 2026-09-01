// src/pages/api/mx.ts
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
    const records = await resolver.resolveMx(domain);
    records.sort((a, b) => a.priority - b.priority);

    // Enriquecer cada registro MX con su resolución IP paralela
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        try {
          const ips = await resolver.resolve4(record.exchange);
          return {
            priority: record.priority,
            exchange: record.exchange,
            ip: ips[0] || 'No disponible'
          };
        } catch {
          return {
            priority: record.priority,
            exchange: record.exchange,
            ip: 'No disponible'
          };
        }
      })
    );

    return new Response(JSON.stringify({
      success: true,
      data: enrichedRecords
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    try {
      const addresses = await resolver.resolve4(domain);
      if (addresses && addresses.length > 0) {
        return new Response(JSON.stringify({
          success: true,
          data: [{ priority: 0, exchange: domain, ip: addresses[0] }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } catch (e) {}

    return new Response(JSON.stringify({ 
      success: true,
      data: [],
      message: `El dominio '${domain}' no cuenta con registros MX configurados o no es accesible públicamente.`
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};