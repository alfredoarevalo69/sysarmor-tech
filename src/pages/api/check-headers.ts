// src/pages/api/check-headers.ts
import type { APIRoute } from 'astro';
import { HeaderAuditor } from '../../utils/headerAuditor';

export const GET: APIRoute = async ({ request }) => {
  const urlParams = new URL(request.url).searchParams;
  const targetUrl = urlParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'URL no proporcionada' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(targetUrl, { method: 'HEAD', redirect: 'follow' });
    const headersRecord: Record<string, string> = {};
    
    response.headers.forEach((value, key) => {
      headersRecord[key] = value;
    });

    // Auditoría de seguridad usando Clean Code / SOLID
    const auditor = new HeaderAuditor();
    const auditResult = auditor.audit(response.headers);

    return new Response(JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      headers: headersRecord,
      audit: auditResult
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'No se pudo conectar con el servidor destino.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};