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

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

export function calculateIPv4Subnets(baseIpInput: string, requirements: IPv4Requirement[]): CalculatedIPv4Subnet[] {
  const [cleanIp] = baseIpInput.split('/');
  let currentIpInt = ipToInt(cleanIp);

  const sorted = [...requirements].sort((a, b) => b.hostsNeeded - a.hostsNeeded);
  
  return sorted.map((req) => {
    const totalHostsNeeded = req.hostsNeeded + 2;
    const hostBits = Math.ceil(Math.log2(totalHostsNeeded));
    const cidrBits = 32 - hostBits;
    const blockSize = Math.pow(2, hostBits);
    
    const networkAddress = intToIp(currentIpInt);
    const broadcastInt = currentIpInt + blockSize - 1;
    const broadcastAddress = intToIp(broadcastInt);
    
    const usableStart = intToIp(currentIpInt + 1);
    const usableEnd = intToIp(broadcastInt - 1);
    
    const maskInt = (0xFFFFFFFF << hostBits) >>> 0;
    const subnetMask = intToIp(maskInt);

    const allocatedSubnet: CalculatedIPv4Subnet = {
      name: req.name,
      networkAddress: networkAddress,
      cidr: `/${cidrBits}`,
      subnetMask: subnetMask,
      usableRange: req.hostsNeeded === 1 
        ? `${usableStart} - ${usableStart}` 
        : `${usableStart} - ${usableEnd}`,
      broadcastAddress: broadcastAddress,
      hostsRequested: req.hostsNeeded,
      hostsAllocated: blockSize - 2,
    };

    currentIpInt += blockSize;
    return allocatedSubnet;
  });
}