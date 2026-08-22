// src/pages/api/send-lead.ts
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Obtención y validación estricta de la API Key de Resend desde variables de entorno
    const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('La API Key de Resend no está configurada en las variables de entorno.');
    }

    const resend = new Resend(apiKey);
    const data = await request.json();
    const { email, articleTitle, pdfUrl } = data;

    // Validación del formato del correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Formato de correo electrónico inválido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Registro de Lead en Google Sheets
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEpHpTu-pR_zeP7emUlxokosRotexwBMl09q1nRdQmu2pjUUGYj_pi_QP4E6I_Ql94/exec';
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: 'Interesado Blog (PDF)', 
          correo: email, 
          empresa: articleTitle,
          pdfUrl: pdfUrl || '',
          aceptaOfertas: true 
        }),
      });
    } catch (gErr) {
      console.error('[Google Script Error]', gErr);
    }

    // 3. Notificación instantánea en Telegram
    const token = import.meta.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "8814870414:AAGKNSU4AQIlY6td7TP6jkDHA4IH6yfdOVk";
    const chatId = import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "7845018728";

    if (token && chatId) {
      const fileName = pdfUrl ? pdfUrl.split('/').pop() : 'Documento técnico';
      const telegramMessage = 
        `🔥 *NUEVO LEAD CAPTURADO (PDF)*\n\n` +
        `📧 *Correo:* \`${email}\`\n` +
        `📌 *Artículo:* ${articleTitle}\n` +
        `📄 *Archivo:* \`${fileName}\`\n` +
        `🔗 *Ruta PDF:* \`${pdfUrl || 'N/A'}\`\n` +
        `⏰ *Fecha:* ${new Date().toLocaleString('es-CO')}`;

      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
            parse_mode: 'Markdown'
          })
        });
      } catch (tErr) {
        console.error('[Telegram API Error]', tErr);
      }
    }

    // 4. Envío del correo desde dominio verificado sysarmortech.com
    const fullPdfUrl = pdfUrl 
      ? (pdfUrl.startsWith('http') ? pdfUrl : `https://sysarmortech.com${pdfUrl}`) 
      : 'https://sysarmortech.com/blog';

    let mailResult = null;
    try {
      mailResult = await resend.emails.send({
        from: 'SysArmor Tech <notificaciones@sysarmortech.com>', 
        to: [email],
        subject: `📄 Tu recurso técnico: ${articleTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
            <h2 style="color: #fbbf24; margin-bottom: 16px;">¡Hola! Aquí tienes la guía solicitada.</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
              Gracias por consultar la documentación sobre <strong>"${articleTitle}"</strong> en SysArmor Tech.
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${fullPdfUrl}" target="_blank" style="background-color: #f59e0b; color: #020617; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block;">
                📥 Descargar Recurso PDF
              </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">
              SysArmor Tech — Infraestructura, Seguridad & Hardening de TI.
            </p>
          </div>
        `,
      });

      console.log('[RESEND SUCCESS DATA]:', mailResult);

      if (mailResult.error) {
        console.error('[RESEND API RETURNED ERROR]:', mailResult.error);
        return new Response(
          JSON.stringify({ success: false, error: mailResult.error.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (rErr) {
      console.error('[RESEND EXCEPTION THROWN]:', rErr);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: rErr instanceof Error ? rErr.message : 'Error inesperado en Resend' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Lead registrado y correo enviado correctamente.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Send Lead Server Error]', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno al procesar la solicitud.' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};