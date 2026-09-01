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
        
        // Mapeo directo optimizado para evitar latencia de red en Serverless
        const rdapRegistryMap: Record<string, string> = {
          'com': 'https://rdap.verisign.com/com/v1/',
          'net': 'https://rdap.verisign.com/net/v1/',
          'org': 'https://rdap.publicinterestregistry.org/rdap/',
          'co': 'https://rdap.nic.co/',
          'edu.co': 'https://rdap.nic.co/',
          'gov.co': 'https://rdap.nic.co/',
          'io': 'https://rdap.nic.io/',
          'info': 'https://rdap.afilias.info/rdap/',
          'me': 'https://rdap.nic.me/',
          'cc': 'https://rdap.verisign.com/cc/v1/'
        };

        const selectedServer = rdapRegistryMap[tld] || 'https://rdap.verisign.com/com/v1/';
        endpoint = `${selectedServer}domain/${encodeURIComponent(cleanQuery)}`;
      }

      const response = await fetch(endpoint, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'SysArmorTech-WhoisClient/1.0'
        },
        signal: AbortSignal.timeout(5000) // Timeout de 5s adaptado para Vercel
      });

      if (!response.ok) {
        return {
          success: false,
          error: `El dominio '${cleanQuery}' no se encuentra registrado o el registro oficial no devolvió datos públicos.`
        };
      }

      const data = await response.json();
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