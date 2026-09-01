// src/utils/whoisEngine.ts
export class WhoisEngine {
  public async lookup(query: string): Promise<any> {
    const cleanQuery = this.sanitizeQuery(query);
    
    if (!cleanQuery) {
      throw new Error('Consulta inválida o malformada.');
    }

    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanQuery);

    try {
      let endpoints: string[] = [];

      if (isIp) {
        endpoints = [`https://rdap.arin.net/registry/ip/${cleanQuery}`];
      } else {
        const parts = cleanQuery.split('.');
        const tld = parts.slice(-2).join('.'); // ej. com.co
        const rootTld = parts.pop() || ''; // ej. co

        // Estrategia de múltiples rutas para ccTLDs complejos como Colombia (.co / .com.co)
        if (tld === 'com.co' || tld === 'edu.co' || tld === 'gov.co' || rootTld === 'co') {
          endpoints = [
            `https://rdap.nic.co/domain/${encodeURIComponent(cleanQuery)}`,
            `https://rdap.nic.co/v1/domain/${encodeURIComponent(cleanQuery)}`
          ];
        } else {
          endpoints = [`https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(cleanQuery)}`];
        }
      }

      let response: Response | null = null;
      let data: any = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: { 
              'Accept': 'application/json',
              'User-Agent': 'SysArmorTech-WhoisClient/1.0'
            },
            signal: AbortSignal.timeout(5000)
          });

          if (res.ok) {
            response = res;
            data = await res.json();
            break;
          }
        } catch (e) {
          // Continúa con el siguiente endpoint alternativo si falla
        }
      }

      if (!response || !data) {
        return {
          success: false,
          error: `El registro oficial para '${cleanQuery}' no devolvió datos públicos o la estructura del ccTLD restringe la consulta RDAP.`
        };
      }

      return { success: true, source: 'rdap', data };

    } catch (error: any) {
      return {
        success: false,
        error: `Tiempo de espera agotado al consultar el servidor RDAP para '${cleanQuery}'.`
      };
    }
  }

  private sanitizeQuery(query: string): string {
    return query
      .replace(/^(https?:\/\/)?(www\.)?/i, '')
      .split('/')[0]
      .trim()
      .toLowerCase();
  }
}