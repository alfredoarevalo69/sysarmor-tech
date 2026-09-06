import { Resolver } from 'dns/promises';

const resolver = new Resolver();
resolver.setServers(['1.1.1.1', '8.8.8.8']);

export interface DomainHealthReport {
  domain: string;
  timestamp: string;
  nameservers: string[];
  mxRecords: Array<{ exchange: string; priority: number }>;
  security: {
    spf: string | null;
    dmarc: string | null;
  };
}

export async function analyzeDomainHealth(domain: string): Promise<DomainHealthReport> {
  const [nsRes, mxRes, txtRes, dmarcRes] = await Promise.allSettled([
    resolver.resolveNs(domain),
    resolver.resolveMx(domain),
    resolver.resolveTxt(domain),
    resolver.resolveTxt(`_dmarc.${domain}`),
  ]);

  const nameservers = nsRes.status === 'fulfilled' ? nsRes.value : [];
  const mxRecords = mxRes.status === 'fulfilled' 
    ? mxRes.value.sort((a, b) => a.priority - b.priority) 
    : [];
  
  const txtRecords = txtRes.status === 'fulfilled' ? txtRes.value.flat() : [];
  const spf = txtRecords.find((record) => record.startsWith('v=spf1')) || null;

  const dmarcRecords = dmarcRes.status === 'fulfilled' ? dmarcRes.value.flat() : [];
  const dmarc = dmarcRecords.find((record) => record.startsWith('v=DMARC1')) || null;

  return {
    domain,
    timestamp: new Date().toISOString(),
    nameservers,
    mxRecords,
    security: { spf, dmarc },
  };
}