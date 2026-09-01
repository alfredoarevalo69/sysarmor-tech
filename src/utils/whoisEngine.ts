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
        const rdapBaseUrl = await this.resolveRdapServer(cleanQuery);
        endpoint = `${rdapBaseUrl}domain/${encodeURIComponent(cleanQuery)}`;
      }

      const response = await fetch(endpoint, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'SysArmorTech-WhoisClient/1.0'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        // Fallback secundario a rdap.org si el registro oficial rechaza la petición directa
        return await this.fallbackLookup(cleanQuery);
      }

      const data = await response.json();
      return { success: true, source: 'rdap', data };

    } catch (error: any) {
      return await this.fallbackLookup(cleanQuery);
    }
  }

  private async resolveRdapServer(domain: string): Promise<string> {
    const bootstrap = await this.getIanaBootstrap();
    const parts = domain.split('.');
    
    // Intenta buscar extensiones compuestas (ej. com.co) primero, luego el TLD simple
    let tld = parts.length > 2 ? parts.slice(-2).join('.') : '';
    let selectedServers: string[] = [];

    if (tld) {
      for (const service of bootstrap.services || []) {
        if (service[0].includes(tld)) {
          selectedServers = service[1];
          break;
        }
      }
    }

    if (selectedServers.length === 0) {
      tld = parts.pop() || '';
      for (const service of bootstrap.services || []) {
        if (service[0].includes(tld)) {
          selectedServers = service[1];
          break;
        }
      }
    }

    let server = selectedServers[0] || 'https://rdap.verisign.com/com/v1/';
    if (!server.endsWith('/')) server += '/';
    return server;
  }

  private async getIanaBootstrap(): Promise<any> {
    const now = Date.now();
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
      // Silencioso en caso de fallo de red hacia IANA
    }

    return {
      services: [
        [['com'], ['https://rdap.verisign.com/com/v1/']],
        [['co', 'com.co', 'net.co', 'nom.co'], ['https://rdap.nic.co/']]
      ]
    };
  }

  private async fallbackLookup(query: string): Promise<any> {
    try {
      const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(query)}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'SysArmorTech-WhoisClient/1.0' },
        signal: AbortSignal.timeout(5000)
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, source: 'rdap', data };
      }
    } catch (e) {
      // Falla final si el proxy externo tampoco responde
    }

    return {
      success: false,
      error: `El dominio '${query}' no pudo ser consultado debido a restricciones del registro oficial o tiempo de espera agotado.`
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