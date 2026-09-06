// src/utils/dmarc-generator.ts
export type DmarcPolicy = 'none' | 'quarantine' | 'reject';
export type AlignmentMode = 'r' | 's';

export interface DmarcConfig {
  policy: DmarcPolicy;
  subdomainPolicy?: DmarcPolicy;
  pct?: number;
  rua: string[];
  ruf?: string[];
  aspf?: AlignmentMode;
  adkim?: AlignmentMode;
}

export function generateDmarcRecord(config: DmarcConfig): string {
  const parts: string[] = ['v=DMARC1', `p=${config.policy}`];

  if (config.subdomainPolicy) parts.push(`sp=${config.subdomainPolicy}`);
  if (config.pct !== undefined && config.pct !== 100) parts.push(`pct=${config.pct}`);
  if (config.rua?.length) parts.push(`rua=${config.rua.join(',')}`);
  if (config.ruf?.length) parts.push(`ruf=${config.ruf.join(',')}`);
  if (config.aspf) parts.push(`aspf=${config.aspf}`);
  if (config.adkim) parts.push(`adkim=${config.adkim}`);

  return parts.join('; ');
}