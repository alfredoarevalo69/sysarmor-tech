// src/pages/api/verify-dns.ts
import type { APIRoute } from 'astro';
import dns from 'dns/promises';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { domain, selector } = body;

    if (!domain) {
      return new Response(JSON.stringify({ error: 'El dominio es requerido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanDomain = domain.trim().toLowerCase();
    const cleanSelector = selector ? selector.trim() : '';
    
    let dkimStatus = 'SKIPPED';
    let dkimRecord = '';
    let dkimQname = '';

    let dmarcStatus = 'FAIL';
    let dmarcRecord = '';
    let dmarcQname = `_dmarc.${cleanDomain}`;

    // 1. Lógica DMARC Blindada con Cascada Ascendente Segura
    let currentDomainParts = cleanDomain.split('.');
    let dmarcFound = false;

    while (currentDomainParts.length >= 2 && !dmarcFound) {
      const testDomain = currentDomainParts.join('.');
      const testQname = `_dmarc.${testDomain}`;

      try {
        const records = await dns.resolveTxt(testQname);
        // Aplanar los registros TXT obtenidos
        const flatRecord = records.map(chunk => chunk.join('')).join('');
        
        // Validar que realmente sea un registro DMARC válido (comienza con v=DMARC1)
        if (flatRecord.toUpperCase().includes('V=DMARC1')) {
          dmarcRecord = flatRecord;
          dmarcQname = testQname;
          dmarcStatus = 'PASS';
          dmarcFound = true;
          break;
        }
      } catch (_err) {
        // El registro no existe o falló la resolución en este nivel, continuamos subiendo
      }

      // Subir un nivel en la jerarquía (ej: de co.bancofalabella.com a bancofalabella.com)
      currentDomainParts.shift();
    }

    // 2. Resolver DKIM solo si el usuario especificó un selector
    if (cleanSelector) {
      dkimQname = `${cleanSelector}._domainkey.${cleanDomain}`;
      dkimStatus = 'FAIL';
      
      try {
        const txtRecords = await dns.resolveTxt(dkimQname);
        dkimRecord = txtRecords.map(chunk => chunk.join('')).join('');
        dkimStatus = 'PASS';
      } catch {
        try {
          const cnameRecords = await dns.resolveCname(dkimQname);
          if (cnameRecords && cnameRecords.length > 0) {
            const targetTxt = await dns.resolveTxt(cnameRecords[0]);
            dkimRecord = targetTxt.map(chunk => chunk.join('')).join('');
            dkimStatus = 'PASS';
          }
        } catch {
          dkimStatus = 'FAIL';
        }
      }
    }

    return new Response(JSON.stringify({
      dkim: { status: dkimStatus, record: dkimRecord, qname: dkimQname },
      dmarc: { status: dmarcStatus, record: dmarcRecord, qname: dmarcQname }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error general en verify-dns:', error);
    return new Response(JSON.stringify({ error: 'Error interno en la consulta DNS.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};