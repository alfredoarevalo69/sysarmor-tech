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
        if (rdapBaseUrl.includes('registry.co')) {
          endpoint = `${rdapBaseUrl}co/domain/${encodeURIComponent(cleanQuery)}`;
        } else {
          endpoint = `${rdapBaseUrl}domain/${encodeURIComponent(cleanQuery)}`;
        }
      }

      const response = await fetch(endpoint, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'SysArmorTech-WhoisClient/1.0'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        return await this.fallbackLookup(cleanQuery);
      }

      const rawData = await response.json();
      const flattenedData = this.flattenRdapToWhoisFormat(rawData);
      return { success: true, source: 'rdap', data: flattenedData };

    } catch (error: any) {
      return await this.fallbackLookup(cleanQuery);
    }
  }

  private flattenRdapToWhoisFormat(data: any): Record<string, any> {
    if (!data || typeof data !== 'object') return data;

    const flat: Record<string, any> = {};

    if (data.ldhName || data.handle) {
      flat['Domain Name'] = (data.ldhName || '').toUpperCase();
      flat['Registry Domain ID'] = data.handle;
    }

    if (Array.isArray(data.events)) {
      for (const event of data.events) {
        if (event.eventAction === 'registration') flat['Creation Date'] = event.eventDate;
        if (event.eventAction === 'expiration') flat['Registry Expiry Date'] = event.eventDate;
        if (['last changed', 'last update', 'last modified'].includes(event.eventAction)) {
          flat['Updated Date'] = event.eventDate;
        }
      }
    }

    if (Array.isArray(data.status)) {
      flat['Domain Status'] = data.status.join(', ');
    }

    if (Array.isArray(data.nameservers)) {
      flat['Name Server'] = data.nameservers.map((ns: any) => ns.ldhName || ns.unicodeName).filter(Boolean);
    }

    if (data.secureDNS && typeof data.secureDNS === 'object') {
      flat['DNSSEC'] = data.secureDNS.delegationSigned ? 'signedDelegation' : 'unsigned';
    }

    // Extracción profunda de entidades, registrar y contactos de abuso anidados
    if (Array.isArray(data.entities)) {
      for (const entity of data.entities) {
        const roles = entity.roles || [];
        const vcard = this.parseVCardToMap(entity.vcardArray);

        if (roles.includes('registrar')) {
          flat['Registrar'] = vcard['fn'] || entity.handle;
          if (vcard['url']) flat['Registrar URL'] = vcard['url'];
          if (vcard['email']) flat['Registrar Abuse Contact Email'] = vcard['email'];
          if (vcard['tel']) flat['Registrar Abuse Contact Phone'] = vcard['tel'];
        }

        if (roles.includes('abuse') || roles.includes('registrar-abuse')) {
          if (vcard['email']) flat['Registrar Abuse Contact Email'] = vcard['email'];
          if (vcard['tel']) flat['Registrar Abuse Contact Phone'] = vcard['tel'];
        }

        // Sub-entidades (común en registros modernos para aislar contactos de abuso)
        if (Array.isArray(entity.entities)) {
          for (const subEntity of entity.entities) {
            const subRoles = subEntity.roles || [];
            const subVcard = this.parseVCardToMap(subEntity.vcardArray);
            if (subRoles.includes('abuse') || subRoles.includes('registrar-abuse')) {
              if (subVcard['email']) flat['Registrar Abuse Contact Email'] = subVcard['email'];
              if (subVcard['tel']) flat['Registrar Abuse Contact Phone'] = subVcard['tel'];
            }
          }
        }
      }
    }

    flat['URL of the ICANN Whois Inaccuracy Complaint Form'] = 'https://www.icann.org/wicf/';
    flat['Last update of WHOIS database'] = new Date().toISOString();

    return { ...data, ...flat };
  }

  private parseVCardToMap(vcardArray: any[]): Record<string, string> {
    const map: Record<string, string> = {};
    if (!Array.isArray(vcardArray) || vcardArray.length < 2) return map;

    const fields = vcardArray[1];
    if (!Array.isArray(fields)) return map;

    for (const field of fields) {
      if (!Array.isArray(field) || field.length < 4) continue;
      const [key, , , value] = field;
      if (typeof value === 'string') {
        map[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        map[key] = value[value.length - 1];
      }
    }

    return map;
  }

  private async resolveRdapServer(domain: string): Promise<string> {
    if (
      domain.endsWith('.com.co') || 
      domain.endsWith('.net.co') || 
      domain.endsWith('.nom.co') || 
      domain.endsWith('.gov.co') || 
      domain.endsWith('.edu.co') || 
      domain.endsWith('.co')
    ) {
      return 'https://rdap.registry.co/';
    }

    const bootstrap = await this.getIanaBootstrap();
    const parts = domain.split('.');
    
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
      // Silencioso
    }

    return {
      services: [
        [['com'], ['https://rdap.verisign.com/com/v1/']],
        [['co', 'com.co', 'gov.co', 'edu.co'], ['https://rdap.registry.co/']]
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
        const flattenedData = this.flattenRdapToWhoisFormat(data);
        return { success: true, source: 'rdap', data: flattenedData };
      }
    } catch (e) {
      // Falla final
    }

    return {
      success: false,
      error: `El dominio '${query}' no pudo ser consultado. El registro oficial no devolvió datos públicos.`
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