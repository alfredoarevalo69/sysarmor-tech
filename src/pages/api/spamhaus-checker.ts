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

    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0];
    const targetUrl = `http://${cleanDomain}/`;

    // MODO DE PRUEBA TEMPORAL: Simulación de listado en los 3 motores
    const isTestSimulation = cleanDomain === 'malicious-test.com';

    // 1. Verificación en Spamhaus DQS
    let spamhausResult = { listed: false, codes: [] as string[], diagnostics: [] as any[] };
    
    if (isTestSimulation) {
      spamhausResult.listed = true;
      spamhausResult.codes = ['127.0.0.2'];
      spamhausResult.diagnostics = [{
        ip: '127.0.0.2',
        info: spamhausReasons['127.0.0.2']
      }];
    } else {
      const dqsKey = import.meta.env.SPAMHAUS_DQS_KEY;
      if (dqsKey) {
        const queryZone = `${cleanDomain}.${dqsKey}.zen.dq.spamhaus.net`;
        try {
          const addresses = await dns.resolve4(queryZone);
          if (addresses && addresses.length > 0) {
            spamhausResult.listed = true;
            spamhausResult.codes = addresses;
            spamhausResult.diagnostics = addresses.map(ip => ({
              ip,
              info: spamhausReasons[ip] || { list: 'Desconocido / ZEN', desc: 'Código de bloqueo general de Spamhaus', delistUrl: 'https://www.spamhaus.org/lookup/' }
            }));
          }
        } catch (dnsError: any) {
          if (dnsError.code !== 'ENOTFOUND') {
            console.error('Error en consulta DNS Spamhaus DQS:', dnsError);
          }
        }
      }
    }

    // 2. Verificación en Google Safe Browsing
    let googleResult = { listed: false, details: '' };
    
    if (isTestSimulation) {
      googleResult.listed = true;
      googleResult.details = 'SOCIAL_ENGINEERING (Simulación)';
    } else {
      const googleKey = import.meta.env.GOOGLE_SAFE_BROWSING_API_KEY;
      if (googleKey) {
        try {
          const gsbResponse = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${googleKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client: { clientId: 'sysarmor-tech-checker', clientVersion: '1.0' },
              threatInfo: {
                threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
                platformTypes: ['ANY_PLATFORM'],
                threatEntryTypes: ['URL'],
                threatEntries: [
                  { url: targetUrl },
                  { url: `https://${cleanDomain}/` }
                ]
              }
            })
          });

          if (gsbResponse.ok) {
            const gsbData = await gsbResponse.json();
            if (gsbData && gsbData.matches && gsbData.matches.length > 0) {
              googleResult.listed = true;
              googleResult.details = gsbData.matches[0].threatType || 'Amenaza detectada';
            }
          }
        } catch (gsbErr) {
          console.error('Error al consultar Google Safe Browsing:', gsbErr);
        }
      }
    }

    // 3. Verificación en PhishTank
    let phishTankResult = { listed: false, details: '' };
    
    if (isTestSimulation) {
      phishTankResult.listed = true;
      phishTankResult.details = 'Reportado y verificado como Phishing activo (Simulación)';
    } else {
      try {
        const ptResponse = await fetch('https://checkurl.phishtank.com/checkurl/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'phishtank/sysarmor-tech-checker'
          },
          body: new URLSearchParams({
            url: targetUrl,
            format: 'json'
          })
        });

        if (ptResponse.ok) {
          const ptData = await ptResponse.json();
          if (ptData && ptData.results) {
            const isDatabaseMatch = ptData.results.in_database === true || ptData.results.in_database === 'true';
            const isValidPhish = ptData.results.valid === true || ptData.results.valid === 'y';
            
            if (isDatabaseMatch && isValidPhish) {
              phishTankResult.listed = true;
              phishTankResult.details = 'Reportado y verificado como Phishing activo';
            }
          }
        }
      } catch (ptErr) {
        console.error('Error al consultar PhishTank:', ptErr);
      }
    }

    return new Response(JSON.stringify({
      domain: cleanDomain,
      spamhaus: spamhausResult,
      googleSafeBrowsing: googleResult,
      phishTank: phishTankResult,
      provider: 'Multi-Engine Security Checker'
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