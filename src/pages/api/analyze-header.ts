import type { APIRoute } from 'astro';
import { simpleParser } from 'mailparser';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const rawHeader = data.get('rawHeader')?.toString();

    if (!rawHeader) {
      return new Response(JSON.stringify({ error: 'La cabecera no puede estar vacía.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const parsed = await simpleParser(rawHeader);
    const authResultsVal = parsed.headers.get('authentication-results');
    const authResults = typeof authResultsVal === 'string' ? authResultsVal : '';
    
    const extractStatus = (text: string, protocol: string) => {
      const regex = new RegExp(`${protocol}=(\\w+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].toUpperCase() : 'NO ENCONTRADO';
    };

    // Procesar los saltos (Received headers) asegurando el tipo string[]
    const receivedHeaders = parsed.headers.get('received');
    let receivedArray: string[] = [];
    if (Array.isArray(receivedHeaders)) {
      receivedArray = receivedHeaders.map(h => String(h));
    } else if (typeof receivedHeaders === 'string') {
      receivedArray = [receivedHeaders];
    } else if (receivedHeaders) {
      receivedArray = [String(receivedHeaders)];
    }

    const hops = receivedArray.map((hopText, index) => {
      let timestamp = 'N/A';
      const parts = hopText.split(';');
      if (parts.length > 1) {
        timestamp = parts[parts.length - 1].trim();
      }
      return {
        step: index + 1,
        details: hopText.replace(/\r?\n|\r/g, ' ').trim(),
        timestamp: timestamp
      };
    }).reverse();

    let hopsWithDelay = hops.map((hop, i, arr) => {
      let delaySeconds = 0;
      if (i > 0) {
        const prevTime = new Date(arr[i - 1].timestamp).getTime();
        const currTime = new Date(hop.timestamp).getTime();
        if (!isNaN(prevTime) && !isNaN(currTime)) {
          delaySeconds = Math.round((currTime - prevTime) / 1000);
        }
      }
      return {
        ...hop,
        delay: delaySeconds >= 0 ? delaySeconds : 0
      };
    });

    const recipientText = Array.isArray(parsed.to) 
      ? parsed.to.map(item => item.text).join(', ') 
      : (parsed.to ? (parsed.to as any).text || String(parsed.to) : 'N/A');

    const senderText = Array.isArray(parsed.from) 
      ? parsed.from.map(item => item.text).join(', ') 
      : (parsed.from ? (parsed.from as any).text || String(parsed.from) : 'N/A');

    const analysisResult = {
      metadata: {
        sender: senderText,
        recipient: recipientText,
        subject: parsed.subject || 'N/A',
        date: parsed.date ? parsed.date.toUTCString() : 'N/A',
      },
      security: {
        spf: extractStatus(authResults, 'spf'),
        dkim: extractStatus(authResults, 'dkim'),
        dmarc: extractStatus(authResults, 'dmarc'),
      },
      hopsCount: receivedArray.length,
      hops: hopsWithDelay
    };

    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al procesar la cabecera. Asegúrate de que el formato sea válido.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};