// src/pages/api/generate-dmarc.ts
import type { APIRoute } from 'astro';
import { generateDmarcRecord, type DmarcConfig } from '../../utils/dmarc-generator';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: DmarcConfig = await request.json();
    const record = generateDmarcRecord(body);

    return new Response(JSON.stringify({ success: true, record }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};