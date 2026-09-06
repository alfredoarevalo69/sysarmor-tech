// src/pages/api/dns-health.ts
import type { APIRoute } from 'astro';
import { Resolver } from 'dns/promises';

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain')?.trim().toLowerCase();

  if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
    return new Response(JSON.stringify({ success: false, error: 'Dominio inválido' }), { status: 400 });
  }

  try {
    // 1. Consultar Servidores de Nombres (NS)
    let nameservers: string[] = [];
    try {
      nameservers = await resolver.resolveNs(domain);
    } catch (e) {
      nameservers = [];
    }

    // 2. Consultar Registros MX con la misma lógica robusta del validador MX
    let enrichedRecords: any[] = [];
    try {
      const records = await resolver.resolveMx(domain);
      records.sort((a, b) => a.priority - b.priority);

      enrichedRecords = await Promise.all(
        records.map(async (record) => {
          let ips: string[] = [];
          try {
            const ipv4s = await resolver.resolve4(record.exchange);
            ips.push(...ipv4s);
          } catch {}

          try {
            const ipv6s = await resolver.resolve6(record.exchange);
            ips.push(...ipv6s);
          } catch {}

          return {
            priority: record.priority,
            exchange: record.exchange,
            ip: ips.length > 0 ? ips : ['No disponible']
          };
        })
      );
    } catch (error) {
      try {
        const addresses = await resolver.resolve4(domain);
        if (addresses && addresses.length > 0) {
          enrichedRecords = [{ priority: 0, exchange: domain, ip: addresses }];
        }
      } catch (e) {}
    }

    // 3. Consultar Registros de Seguridad (SPF y DMARC)
    let spfRecord = null;
    let dmarcRecord = null;
    let lookupCount = 0;
    let exceedsLimit = false;
    let isStrictSpf = false;

    try {
      const txtRecords = await resolver.resolveTxt(domain);
      const spfText = txtRecords.flat().find(t => t.startsWith('v=spf1'));
      if (spfText) {
        spfRecord = spfText;
        isStrictSpf = spfText.includes('-all');
        const mechanisms = spfText.split(' ').slice(1);
        lookupCount = mechanisms.filter(m => 
          m.startsWith('include:') || 
          m.startsWith('a:') || 
          m.startsWith('mx:') || 
          m.startsWith('ptr') || 
          m.startsWith('exists:') || 
          m.startsWith('redirect=')
        ).length;
        exceedsLimit = lookupCount > 10;
      }
    } catch (e) {}

    try {
      const dmarcTxt = await resolver.resolveTxt(`_dmarc.${domain}`);
      const dmarcText = dmarcTxt.flat().find(t => t.startsWith('v=DMARC1'));
      if (dmarcText) {
        dmarcRecord = dmarcText;
      }
    } catch (e) {}

    return new Response(
      JSON.stringify({
        success: true,
        domain,
        nameservers,
        mxRecords: enrichedRecords,
        security: {
          spf: spfRecord,
          dmarc: dmarcRecord,
          lookupCount,
          exceedsLimit,
          isStrictSpf
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: `No se pudieron resolver los registros DNS para: ${domain}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};