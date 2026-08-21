// src/pages/api/reaction.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { articleTitle, vote, reason } = body;

    const BOT_TOKEN = import.meta.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    // Fallback de desarrollo local
    const FINAL_TOKEN = BOT_TOKEN || "8814870414:AAGKNSU4AQIlY6td7TP6jkDHA4IH6yfdOVk";
    const FINAL_CHAT_ID = CHAT_ID || "7845018728";

    if (!FINAL_TOKEN || !FINAL_CHAT_ID) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuración de entorno ausente.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emoji = vote === 'like' ? '👍' : '👎';
    const text = `${emoji} Nueva interacción en SysArmor Tech\n\nArtículo: ${articleTitle}\nVoto: ${vote === 'like' ? 'Útil' : 'No útil'}\nMotivo: ${reason || 'Sin motivo especificado'}`;

    const telegramRes = await fetch(`https://api.telegram.org/bot${FINAL_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: FINAL_CHAT_ID,
        text: text,
      }),
    });

    const resData = await telegramRes.json();

    if (!telegramRes.ok) {
      console.error('[Telegram API Error]', resData);
      return new Response(
        JSON.stringify({ success: false, error: resData.description }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[SysArmor Server Error]', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno procesando la petición.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};