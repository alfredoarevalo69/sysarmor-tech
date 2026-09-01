// src/utils/whoisEngine.ts
export class WhoisEngine {
  public async lookup(query: string): Promise<any> {
    const cleanQuery = this.sanitizeQuery(query);
    
    if (!cleanQuery) {
      throw new Error('Consulta inválida o malformada.');
    }

    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanQuery);

    try {
      let endpoint = '';

      if (isIp) {
        endpoint = `https://rdap.arin.net/registry/ip/${cleanQuery}`;
      } else {
        const tld = cleanQuery.split('.').pop()?.toLowerCase();
        const bootstrapRes = await fetch('https://data.iana.org/rdap/dns.json', {
          signal: AbortSignal.timeout(4000)
        });
        
        if (!bootstrapRes.ok) throw new Error('No se pudo cargar el bootstrap de ICANN');
        
        const bootstrapData = await bootstrapRes.json();
        let selectedServer = 'https://rdap.verisign.com/com/v1/'; // Fallback por defecto

        for (const service of bootstrapData.services || []) {
          const tlds = service[0];
          const servers = service[1];
          if (tlds.includes(tld)) {
            selectedServer = servers[0];
            break;
          }
        }

        endpoint = `${selectedServer}domain/${encodeURIComponent(cleanQuery)}`;
      }

      const response = await fetch(endpoint, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'SysArmorTech-WhoisClient/1.0'
        },
        signal: AbortSignal.timeout(6000) // Timeout estricto de 6 segundos
      });

      if (!response.ok) {
        return {
          success: false,
          status: "NOT_FOUND_OR_PROTECTED",
          message: `El dominio '${cleanQuery}' no devolvió registros públicos o cuenta con restricciones estrictas de privacidad.`
        };
      }

      const data = await response.json();
      return { success: true, source: 'rdap', data };

    } catch (error: any) {
      return {
        success: false,
        status: "LOOKUP_NOTICE",
        message: `Tiempo de espera agotado o error al consultar el registro oficial para '${cleanQuery}'.`
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