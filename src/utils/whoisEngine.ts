// src/utils/whoisEngine.ts
export class WhoisEngine {
  private static ianaCache: { services: [string[], string[]][]; timestamp: number } | null = null;

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
        const server = await this.resolveRdapServer(cleanQuery);
        endpoint = `${server}domain/${encodeURIComponent(cleanQuery)}`;
      }

      const response = await fetch(endpoint, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'SysArmorTech-WhoisClient/1.0'
        },
        signal: AbortSignal.timeout(7000) // Margen seguro de 7 segundos para Vercel
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

  private async resolveRdapServer(domain: string): Promise<string> {
    const parts = domain.split('.');
    let tld = parts.slice(-2).join('.'); // Prueba compuesto (ej. gov.co)
    
    const bootstrapData = await this.getIanaBootstrap();
    let selectedServers: string[] = [];

    for (const service of bootstrapData.services || []) {
      const tlds = service[0];
      const servers = service[1];
      if (tlds.includes(tld)) {
        selectedServers = servers;
        break;
      }
    }

    // Si no encuentra el compuesto, prueba con el TLD simple (ej. co)
    if (selectedServers.length === 0) {
      tld = parts.pop() || '';
      for (const service of bootstrapData.services || []) {
        const tlds = service[0];
        const servers = service[1];
        if (tlds.includes(tld)) {
          selectedServers = servers;
          break;
        }
      }
    }

    // Retorna el primer servidor disponible o un fallback seguro a Verisign
    return selectedServers[0] || 'https://rdap.verisign.com/com/v1/';
  }

  private async getIanaBootstrap(): Promise<any> {
    const now = Date.now();
    // Cachea el archivo de IANA por 24 horas para evitar latencia en cada petición
    if (WhoisEngine.ianaCache && (now - WhoisEngine.ianaCache.timestamp < 86400000)) {
      return WhoisEngine.ianaCache;
    }

    try {
      const res = await fetch('https://data.iana.org/rdap/dns.json', {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        WhoisEngine.ianaCache = { services: data.services, timestamp: now };
        return data;
      }
    } catch (e) {
      // Si falla IANA, retorna un mapa base de emergencia
    }

    return {
      services: [
        [['com'], ['https://rdap.verisign.com/com/v1/']],
        [['net'], ['https://rdap.verisign.com/net/v1/']],
        [['co', 'gov.co', 'edu.co'], ['https://rdap.nic.co/']]
      ]
    };
  }

  private sanitizeQuery(query: string): string {
    return query
      .replace(/^(https?:\/\/)?(www\.)?/i, '')
      .split('/')[0]
      .trim()
      .toLowerCase();
  }
}