import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email, articleTitle, pdfUrl } = data;

    // Validación del formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Formato de correo electrónico inválido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Registro de Lead en Google Sheets
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

    // 2. Notificación instantánea en Telegram
    const token = import.meta.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "8814870414:AAGKNSU4AQIlY6td7TP6jkDHA4IH6yfdOVk";
    const chatId = import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "7845018728";

    if (token && chatId) {
      const telegramMessage = 
        `🔥 *NUEVO LEAD CAPTURADO (PDF)*\n\n` +
        `📧 *Correo:* \`${email}\`\n` +
        `📌 *Artículo:* ${articleTitle}\n` +
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

    // 3. Configuración del Transporte SMTP (Gmail)
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.error('[CRITICAL]: Faltan credenciales SMTP_USER o SMTP_PASS.');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuración SMTP incompleta en el servidor.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Mapeo seguro y exacto del nombre del archivo PDF según el título del artículo
    let pdfFileName = 'Hardening Correo Corporativo.pdf'; // Valor por defecto
    const lowerTitle = (articleTitle || '').toLowerCase();

    if (lowerTitle.includes('correo')) {
      pdfFileName = 'Hardening Correo Corporativo.pdf';
    } else if (lowerTitle.includes('dmsa')) {
      pdfFileName = 'implementacion-cuentas-dmsa-windows-2025.pdf';
    } else if (lowerTitle.includes('laps')) {
      pdfFileName = 'Instalar y configurar LAPS.pdf';
    } else if (lowerTitle.includes('entra') || lowerTitle.includes('sso')) {
      pdfFileName = 'Integracion SSO con Entra ID.pdf';
    } else if (lowerTitle.includes('intune')) {
      pdfFileName = 'Intune Implementacion Hibrida.pdf';
    } else if (lowerTitle.includes('dns')) {
      pdfFileName = 'optimizacion-dns-active-directory-hub-spoke-hibrido.pdf';
    }

    const fullPdfUrl = `https://sysarmortech.com/docs/${encodeURIComponent(pdfFileName)}`;

    await transporter.sendMail({
      from: `"SysArmor Tech" <${smtpUser}>`,
      to: email,
      subject: `📄 Tu recurso técnico: ${articleTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
          <h2 style="color: #fbbf24; margin-bottom: 16px;">¡Hola! Aquí tienes la guía solicitada.</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            Gracias por consultar la documentación técnica sobre <strong>"${articleTitle}"</strong> en SysArmor Tech.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${fullPdfUrl}" target="_blank" style="background-color: #f59e0b; color: #020617; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block;">
              📥 Ver / Descargar Documento PDF
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">
            SysArmor Tech — Infraestructura, Seguridad & Hardening de TI.
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Correo enviado correctamente.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SMTP Server Error]', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno al enviar el correo.' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};