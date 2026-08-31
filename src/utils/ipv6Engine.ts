// @ts-check

export interface IPv6Requirement {
  id: string;
  name: string;
  bitsRequested: number;
}

export interface CalculatedIPv6Subnet {
  name: string;
  ipAddress: string;
  fullIpAddress: string;
  totalIpAddresses: string;
  total64Networks: string;
  network: string;
  ipRange: string;
}

export function calculateIPv6Subnets(baseIp: string, requirements: IPv6Requirement[]): CalculatedIPv6Subnet[] {
  const sortedReqs = [...requirements].sort((a, b) => b.bitsRequested - a.bitsRequested);
  const [baseAddress, basePrefixStr] = baseIp.split('/');
  const basePrefix = parseInt(basePrefixStr || '48', 10);
  const cleanBase = baseAddress.replace(/::$/, '').split(':');

  return sortedReqs.map((req, index) => {
    const assignedPrefix = basePrefix + req.bitsRequested;
    const hostBits = 128 - assignedPrefix;
    const totalIps = hostBits <= 53 ? Math.pow(2, hostBits).toLocaleString('en-US') : `2^${hostBits}`;
    
    const sub64Bits = Math.max(0, 64 - assignedPrefix);
    const total64 = sub64Bits <= 53 ? Math.pow(2, sub64Bits).toLocaleString('en-US') : `2^${sub64Bits}`;

    const hexBlock = (index & 0xffff).toString(16).padStart(4, '0');
    const netFormatted = `${cleanBase.join(':')}:${hexBlock}::`;
    const fullIp = `2001:0db8:cafe:0000:0000:0000:0000:${hexBlock.padStart(4, '0')}`;

    return {
      name: req.name,
      ipAddress: `${netFormatted}/${assignedPrefix}`,
      fullIpAddress: fullIp,
      totalIpAddresses: totalIps,
      total64Networks: total64,
      network: netFormatted,
      ipRange: `${netFormatted} - ${cleanBase.join(':')}:${hexBlock}:ffff:ffff:ffff:ffff`,
    };
  });
}