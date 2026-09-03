import type { APIRoute } from 'astro';
import dns from 'dns/promises';

export const prerender = false;

function parseDkimRecord(rawRecord: string) {
  const parts = rawRecord.split(';');
  const tags: Array<{ tag: string; value: string; name: string; description: string }> = [];

  const definitions: Record<string, { name: string; description: string }> = {
    v: { name: 'Version', description: 'Identifies the record retrieved as a DKIM record. It must be the first tag in the record.' },
    k: { name: 'Key Type', description: 'The type of the key used by tag (p).' },
    p: { name: 'Public Key', description: 'The syntax and semantics of this tag value before being encoded in base64 are defined by the (k) tag.' },
    h: { name: 'Acceptable Hash Algorithms', description: 'List of acceptable hash algorithms.' },
    t: { name: 'Flags', description: 'Flags representing service type or test mode.' },
    s: { name: 'Service Type', description: 'The service type(s) that the record applies to.' },
  };

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const tag = trimmed.substring(0, eqIndex).trim().toLowerCase();
    const value = trimmed.substring(eqIndex + 1).trim();

    const def = definitions[tag] || { name: 'Custom Tag', description: 'Extension or vendor-specific tag.' };
    tags.push({ tag, value, name: def.name, description: def.description });
  }

  return tags;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { domain, selector } = body;

    if (!domain || !selector) {
      return new Response(JSON.stringify({ error: 'El dominio y el selector son requeridos.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanDomain = domain.trim().toLowerCase();
    const cleanSelector = selector.trim();
    const dkimQname = `${cleanSelector}._domainkey.${cleanDomain}`;
    
    let dkimStatus = 'FAIL';
    let dkimRecord = '';
    let parsedTags: any[] = [];

    try {
      dns.setServers(['1.1.1.1', '8.8.8.8']);
    } catch (e) {}

    try {
      const txtRecords = await dns.resolveTxt(dkimQname);
      dkimRecord = txtRecords.map(chunk => chunk.join('')).join('');
      dkimStatus = 'PASS';
      parsedTags = parseDkimRecord(dkimRecord);
    } catch {
      try {
        const cnameRecords = await dns.resolveCname(dkimQname);
        if (cnameRecords && cnameRecords.length > 0) {
          const targetTxt = await dns.resolveTxt(cnameRecords[0]);
          dkimRecord = targetTxt.map(chunk => chunk.join('')).join('');
          dkimStatus = 'PASS';
          parsedTags = parseDkimRecord(dkimRecord);
        }
      } catch {
        dkimStatus = 'FAIL';
      }
    }

    return new Response(JSON.stringify({
      status: dkimStatus,
      record: dkimRecord,
      qname: dkimQname,
      tags: parsedTags
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno en la consulta DNS DKIM.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};