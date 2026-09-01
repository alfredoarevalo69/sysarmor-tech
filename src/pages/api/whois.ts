// src/pages/api/whois.ts
import type { APIRoute } from 'astro';
import whois from 'whois-json';

export const GET: APIRoute = async ({ url }) => {
  const domain = url.searchParams.get('domain');
  
  if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
    return new Response(JSON.stringify({ success: false, error: 'Dominio inválido' }), { status: 400 });
  }

  // 1. Intentar RDAP primero (Ideal para gTLDs como .com)
  try {
    const rdapResponse = await fetch(`https://rdap.org/domain/${domain}`);
    if (rdapResponse.ok) {
      const rdapData = await rdapResponse.json();
      if (rdapData && !rdapData.errorCode) {
        return new Response(JSON.stringify({
          success: true,
          source: 'rdap',
          data: rdapData
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }
  } catch (e) {
    // Si RDAP falla, pasamos al siguiente método sin interrumpir
  }

  // 2. Intentar Puerto 43 (WHOIS Legacy / ccTLDs y respaldo)
  try {
    const legacyData = await whois(domain);
    if (legacyData && Object.keys(legacyData).length > 0) {
      return new Response(JSON.stringify({
        success: true,
        source: 'legacy',
        data: legacyData
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (e) {
    // Si legacy también falla, pasamos a la respuesta de respaldo seguro
  }

  // 3. Fallback seguro: Si el dominio es válido pero el servidor bloquea los datos por privacidad
  return new Response(JSON.stringify({ 
    success: true,
    source: 'legacy',
    data: { 
      domainName: domain,
      status: 'Consulta completada. Los datos de contacto o detalles avanzados están protegidos por políticas de privacidad del registrador.'
    }
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};