// src/pages/api/reaction.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { articleTitle, vote, reason } = body;

    // Lee las variables de entorno o usa el fallback para entorno local
    const BOT_TOKEN = import.meta.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "8814870414:AAGKNSU4AQIlY6td7TP6jkDHA4IH6yfdOVk";
    const CHAT_ID = import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "7845018728";

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuración de entorno ausente.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emoji = vote === 'like' ? '👍' : '👎';
    const voteText = vote === 'like' ? 'Útil' : 'No útil';
    
    const telegramMessage = 
      `${emoji} *NUEVA REACCIÓN EN BLOG*\n\n` +
      `📌 *Artículo:* ${articleTitle}\n` +
      `📊 *Voto:* ${voteText}\n` +
      `💬 *Motivo:* \`${reason || 'Sin motivo especificado'}\`\n` +
      `⏰ *Fecha:* ${new Date().toLocaleString('es-CO')}`;

    const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: telegramMessage,
        parse_mode: 'Markdown'
      }),
    });

    const resData = await telegramRes.json();

    if (!telegramRes.ok) {
      console.error('[Telegram API Error]', resData);
      return new Response(
        JSON.stringify({ success: false, error: resData.description || 'Error al enviar notificación' }),
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