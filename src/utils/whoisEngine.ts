// src/utils/whoisEngine.ts
import * as net from 'net';

export class WhoisEngine {
  public async lookup(query: string): Promise<any> {
    const cleanQuery = this.sanitizeQuery(query);
    
    if (!cleanQuery) {
      throw new Error('Consulta inválida o malformada.');
    }

    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanQuery);
    const isCcTLDCo = cleanQuery.endsWith('.co') || cleanQuery.endsWith('.com.co') || cleanQuery.endsWith('.edu.co') || cleanQuery.endsWith('.gov.co');

    // 1. Intento principal por RDAP para dominios globales (.com, .org, etc.)
    if (!isIp && !isCcTLDCo) {
      try {
        const endpoint = `https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(cleanQuery)}`;
        const res = await fetch(endpoint, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'SysArmorTech-WhoisClient/1.0' },
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, source: 'rdap', data };
        }
      } catch (e) {
        // Continúa al siguiente método si falla
      }
    }

    // 2. Intento secundario por Sockets TCP (Puerto 43)
    try {
      const whoisServer = this.getWhoisServer(cleanQuery);
      const rawText = await this.queryTcpWhois(whoisServer, cleanQuery);
      
      if (rawText && rawText.trim().length > 50 && !rawText.includes('ERROR:') && !rawText.includes('Limit Exceeded')) {
        const parsedData = this.parseWhoisText(rawText);
        return { success: true, source: 'legacy', data: parsedData };
      }
    } catch (err: any) {
      // Si el socket falla (ej. bloqueado en Vercel), pasa al fallback HTTP
    }

    // 3. Fallback de Nivel 3: Consulta mediante API HTTP pública segura (Resuelve restricciones de puertos en Serverless)
    try {
      const proxyRes = await fetch(`https://rdap.org/domain/${encodeURIComponent(cleanQuery)}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'SysArmorTech-WhoisClient/1.0' },
        signal: AbortSignal.timeout(5000)
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        return { success: true, source: 'rdap', data: proxyData };
      }
    } catch (e) {
      // Falla si el proxy también agota el tiempo
    }

    return {
      success: false,
      error: `El servidor oficial WHOIS y los servicios de respaldo no respondieron a la consulta para '${cleanQuery}'.`
    };
  }

  private getWhoisServer(query: string): string {
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(query)) {
      return 'whois.arin.net';
    }
    if (query.endsWith('.co') || query.endsWith('.com.co') || query.endsWith('.edu.co') || query.endsWith('.gov.co')) {
      return 'whois.nic.co';
    }
    if (query.endsWith('.org')) {
      return 'whois.pir.org';
    }
    return 'whois.verisign-grs.com';
  }

  private queryTcpWhois(server: string, query: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let data = '';

      client.setTimeout(5000);

      client.connect(43, server, () => {
        client.write(`${query}\r\n`);
      });

      client.on('data', (chunk) => {
        data += chunk.toString();
      });

      client.on('timeout', () => {
        client.destroy();
        reject(new Error('TCP WHOIS timeout'));
      });

      client.on('error', (err) => {
        reject(err);
      });

      client.on('close', () => {
        resolve(data);
      });
    });
  }

  private parseWhoisText(text: string): Record<string, string> {
    const lines = text.split('\n');
    const result: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('%') || trimmed.startsWith('#') || trimmed.startsWith('>>>')) continue;
      
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (key && value && !result[key]) {
          result[key] = value;
        }
      }
    }
    return result;
  }

  private sanitizeQuery(query: string): string {
    return query
      .replace(/^(https?:\/\/)?(www\.)?/i, '')
      .split('/')[0]
      .trim()
      .toLowerCase();
  }
}