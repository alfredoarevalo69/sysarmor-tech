import type { APIRoute } from 'astro';
import { SecurityOrchestrator } from '../../utils/securityOrchestrator';

export const GET: APIRoute = async ({ url }) => {
  const target = url.searchParams.get('target') || 'sysarmortech.com';

  try {
    const orchestrator = new SecurityOrchestrator(target);
    const report = await orchestrator.generateExecutiveReport();

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error al generar el reporte de auditoría', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};