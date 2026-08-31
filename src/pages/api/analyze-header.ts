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
    const authResults = parsed.headers.get('authentication-results') || '';
    
    const extractStatus = (text: string, protocol: string) => {
      const regex = new RegExp(`${protocol}=(\\w+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].toUpperCase() : 'NO ENCONTRADO';
    };

    // Procesar los saltos (Received headers)
    const receivedHeaders = parsed.headers.get('received');
    let receivedArray: string[] = [];
    if (Array.isArray(receivedHeaders)) {
      receivedArray = receivedHeaders;
    } else if (typeof receivedHeaders === 'string') {
      receivedArray = [receivedHeaders];
    }

    // mailparser suele ordenarlos del más reciente al más antiguo, 
    // pero para ver la ruta lógica solemos ordenarlos cronológicamente o analizarlos por orden de llegada.
    const hops = receivedArray.map((hopText, index) => {
      // Extraer fecha si existe en el salto (suele estar despues del punto y coma ;)
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
    }).reverse(); // Invertir para ver el flujo desde el origen hasta el destino final

    // Calcular tiempos entre saltos si es posible
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

    const analysisResult = {
      metadata: {
        sender: parsed.from?.text || 'N/A',
        recipient: parsed.to?.text || 'N/A',
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