// src/pages/api/analyze-header.ts
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

    // Búsqueda ultraselectiva enfocada únicamente en cabeceras de tipo DKIM-Signature real
    let extractedSelector = 'No detectado';
    
    const dkimHeaders = parsed.headers.get('dkim-signature');
    if (dkimHeaders) {
      const dkimArray = Array.isArray(dkimHeaders) ? dkimHeaders : [dkimHeaders];
      for (const dkimText of dkimArray) {
        const textStr = String(dkimText);
        const selectorMatch = textStr.match(/(?:^|[\s;])s=([a-zA-Z0-9_-]+)/i);

        if (selectorMatch && selectorMatch[1]) {
          const selectorVal = selectorMatch[1];
          // Descartar explícitamente cualquier selector ligado a ARC o infraestructura de intermediarios
          if (selectorVal.toLowerCase().includes('arc')) continue;

          extractedSelector = selectorVal;
          break;
        }
      }
    }

    // Fallback estricto línea por línea que ignora cabeceras ARC y sellos de reenvío
    if (extractedSelector === 'No detectado') {
      const lines = rawHeader.split(/\r?\n/);
      let insideDkimBlock = false;

      for (const line of lines) {
        const trimmed = line.trim();

        // Detectar si entramos a una línea de cabecera DKIM-Signature real
        if (/^dkim-signature:/i.test(trimmed)) {
          insideDkimBlock = true;
        } else if (/^[a-z-]+:/i.test(trimmed)) {
          // Si empieza otra cabecera distinta, cerramos el bloque DKIM
          insideDkimBlock = false;
        }

        // Solo evaluamos el selector si estamos dentro de una firma DKIM legítima o si la línea no es ARC
        if (insideDkimBlock || (!/^(arc-|x-google-dkim-|received-|return-path)/i.test(trimmed))) {
          const match = trimmed.match(/(?:^|[;\s])s=([a-zA-Z0-9_-]{2,50})(?=[\s;]|$)/i);
          if (match && match[1]) {
            const val = match[1];
            if (!['http', 'https', 'max', 'min'].includes(val.toLowerCase()) && !val.toLowerCase().includes('arc')) {
              extractedSelector = val;
              break;
            }
          }
        }
      }
    }

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
        dkimSelector: extractedSelector,
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