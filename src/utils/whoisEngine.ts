// src/utils/whoisEngine.ts
export class WhoisEngine {
  public async lookup(query: string): Promise<any> {
    const cleanQuery = this.sanitizeQuery(query);
    
    if (!cleanQuery) {
      throw new Error('Consulta inválida o malformada.');
    }

    try {
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanQuery);
      const endpoint = isIp 
        ? `https://rdap.org/ip/${cleanQuery}` 
        : `https://rdap.org/domain/${cleanQuery}`;

      const response = await fetch(endpoint, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'SysArmorTech-WhoisClient/1.0'
        }
      });

      if (!response.ok) {
        return {
          status: "NOT_FOUND_OR_PROTECTED",
          message: `El dominio '${cleanQuery}' no devolvió registros públicos o cuenta con restricciones estrictas de privacidad.`
        };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        status: "LOOKUP_NOTICE",
        message: `No se pudo completar la consulta RDAP para '${cleanQuery}'. Comprueba tu conexión a internet o firewall.`
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