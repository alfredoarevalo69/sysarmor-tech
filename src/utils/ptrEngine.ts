import dns from 'dns/promises';

export interface PtrLookupResult {
    ip: string;
    hostnames: string[];
    isValid: boolean;
    error?: string;
}

export class PtrEngine {
    public static async resolve(ip: string): Promise<PtrLookupResult> {
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        if (!ipRegex.test(ip)) {
            return { ip, hostnames: [], isValid: false, error: 'Formato de dirección IP inválido (IPv4/IPv6).' };
        }

        try {
            const hostnames = await dns.reverse(ip);
            return {
                ip,
                hostnames,
                isValid: hostnames.length > 0
            };
        } catch (err: any) {
            return {
                ip,
                hostnames: [],
                isValid: false,
                error: err.code === 'ENOTFOUND' ? 'No se encontraron registros PTR (rDNS) configurados para esta IP.' : err.message
            };
        }
    }
}