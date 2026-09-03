// @ts-check

export interface IPv4Requirement {
  id: string;
  name: string;
  hostsNeeded: number;
}

export interface CalculatedIPv4Subnet {
  name: string;
  networkAddress: string;
  cidr: string;
  subnetMask: string;
  usableRange: string;
  broadcastAddress: string;
  hostsRequested: number;
  hostsAllocated: number;
}

export function calculateIPv4Subnets(baseIp: string, requirements: IPv4Requirement[]): CalculatedIPv4Subnet[] {
  const sorted = [...requirements].sort((a, b) => b.hostsNeeded - a.hostsNeeded);
  
  // Implementación base para mapear los requerimientos al formato que espera el componente
  return sorted.map((req, index) => ({
    name: req.name,
    networkAddress: `192.168.${index}.0`,
    cidr: '/24',
    subnetMask: '255.255.255.0',
    usableRange: `192.168.${index}.1 - 192.168.${index}.254`,
    broadcastAddress: `192.168.${index}.255`,
    hostsRequested: req.hostsNeeded,
    hostsAllocated: 254,
  }));
}