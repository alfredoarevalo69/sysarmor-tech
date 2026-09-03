// src/pages/api/whois.ts
import type { APIRoute } from 'astro';
import { WhoisEngine } from '../../utils/whoisEngine';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');

  if (!domain) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Parámetro domain ausente en la petición.' 
      }), 
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const engine = new WhoisEngine();
    const result = await engine.lookup(domain);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno al procesar la consulta WHOIS.' 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};