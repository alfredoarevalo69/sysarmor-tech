// src/pages/api/cidr.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const cidrInput = url.searchParams.get('cidr')?.trim();
  
  if (!cidrInput || !/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(cidrInput)) {
    return new Response(JSON.stringify({ success: false, error: 'Formato CIDR inválido (Ej. 192.168.1.0/24)' }), { status: 400 });
  }

  try {
    const [ipStr, prefixStr] = cidrInput.split('/');
    const prefix = parseInt(prefixStr, 10);

    if (prefix < 0 || prefix > 32) {
      return new Response(JSON.stringify({ success: false, error: 'El prefijo debe estar entre 0 y 32' }), { status: 400 });
    }

    const ipParts = ipStr.split('.').map(Number);
    for (const part of ipParts) {
      if (part < 0 || part > 255) {
        return new Response(JSON.stringify({ success: false, error: 'Dirección IP fuera de rango (0-255)' }), { status: 400 });
      }
    }

    // Convertir IP a entero de 32 bits
    const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
    
    // Calcular máscara
    const maskInt = prefix === 0 ? 0 : (~((1 << (32 - prefix)) - 1)) >>> 0;
    
    // Red y Broadcast
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
    
    // Total de IPs y Hosts utilizables
    const totalIps = Math.pow(2, 32 - prefix);
    let usableHosts = totalIps > 2 ? totalIps - 2 : totalIps;
    if (prefix === 31) usableHosts = 2; // Enlaces punto a punto RFC 3021
    if (prefix === 32) usableHosts = 1;

    // Convertir enteros a formato string IP
    const intToIp = (int: number) => [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255
    ].join('.');

    const networkIp = intToIp(networkInt);
    const broadcastIp = intToIp(broadcastInt);
    const netmask = intToIp(maskInt);
    
    let firstIp = '-';
    let lastIp = '-';

    if (prefix <= 30) {
      firstIp = intToIp(networkInt + 1);
      lastIp = intToIp(broadcastInt - 1);
    } else if (prefix === 31) {
      firstIp = intToIp(networkInt);
      lastIp = intToIp(broadcastInt);
    } else if (prefix === 32) {
      firstIp = networkIp;
      lastIp = networkIp;
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        cidr: `${networkIp}/${prefix}`,
        netmask,
        networkIp,
        broadcastIp,
        firstIp,
        lastIp,
        totalIps,
        usableHosts,
        wildcard: intToIp(~maskInt >>> 0)
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Error al calcular el bloque CIDR.' }), { status: 500 });
  }
};