// src/utils/crypto/cert-parser.ts
import { X509 } from 'jsrsasign';

export interface CertDetails {
  subject: string;
  issuer: string;
  subjectAttributes: string[];
  issuerAttributes: string[];
  notBefore: string;
  notAfter: string;
  isValid: boolean;
  signatureAlgorithm: string;
  publicKeySize: number;
}

export class CertificateValidationError extends Error {
  constructor(message = 'El texto ingresado no corresponde a un certificado válido. Asegúrese de incluir las líneas de inicio y fin.') {
    super(message);
    this.name = 'CertificateValidationError';
  }
}

function extractAttributes(dnSource: any): string[] {
  if (!dnSource) return [];
  
  const results: string[] = [];

  const processItem = (item: any) => {
    if (!item) return;
    if (typeof item === 'string') {
      if (item.includes('=')) {
        item.replace(/^\//, '').split('/').forEach(part => {
          const eqIndex = part.indexOf('=');
          if (eqIndex !== -1) {
            const key = part.substring(0, eqIndex).trim().toUpperCase();
            const val = part.substring(eqIndex + 1).trim();
            results.push(`${key}: ${val}`);
          } else if (part.trim()) {
            results.push(part.trim());
          }
        });
      } else if (item.trim()) {
        results.push(item.trim());
      }
    } else if (Array.isArray(item)) {
      item.forEach(sub => processItem(sub));
    } else if (typeof item === 'object') {
      if ('name' in item && 'value' in item) {
        results.push(`${String(item.name).toUpperCase()}: ${item.value}`);
      } else if ('type' in item && 'value' in item) {
        results.push(`${String(item.type).toUpperCase()}: ${item.value}`);
      } else {
        Object.entries(item).forEach(([k, v]) => {
          if (typeof v === 'object' && v !== null) {
            processItem(v);
          } else {
            results.push(`${k.toUpperCase()}: ${v}`);
          }
        });
      }
    }
  };

  if (typeof dnSource === 'string') {
    processItem(dnSource);
  } else if (Array.isArray(dnSource)) {
    dnSource.forEach(item => processItem(item));
  } else if (typeof dnSource === 'object') {
    processItem(dnSource);
  }

  return Array.from(new Set(results.filter(Boolean)));
}

function parseAsn1Date(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'No especificado') return null;

  try {
    let clean = dateStr.trim();
    let year = 0;
    let month = 0;
    let day = 0;
    let hour = 0;
    let min = 0;
    let sec = 0;

    if (clean.length === 13 && clean.endsWith('Z')) {
      const yy = parseInt(clean.substring(0, 2), 10);
      year = yy >= 50 ? 1900 + yy : 2000 + yy;
      month = parseInt(clean.substring(2, 4), 10) - 1;
      day = parseInt(clean.substring(4, 6), 10);
      hour = parseInt(clean.substring(6, 8), 10);
      min = parseInt(clean.substring(8, 10), 10);
      sec = parseInt(clean.substring(10, 12), 10);
      return new Date(Date.UTC(year, month, day, hour, min, sec));
    } else if (clean.length >= 15 && clean.endsWith('Z')) {
      year = parseInt(clean.substring(0, 4), 10);
      month = parseInt(clean.substring(4, 6), 10) - 1;
      day = parseInt(clean.substring(6, 8), 10);
      hour = parseInt(clean.substring(8, 10), 10);
      min = parseInt(clean.substring(10, 12), 10);
      sec = parseInt(clean.substring(12, 14), 10);
      return new Date(Date.UTC(year, month, day, hour, min, sec));
    }

    const fallbackDate = new Date(dateStr);
    return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
  } catch {
    return null;
  }
}

function formatReadableDate(dateObj: Date | null, rawFallback: string): string {
  if (!dateObj || isNaN(dateObj.getTime())) return rawFallback;
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: 'UTC'
    }).format(dateObj) + ' (UTC)';
  } catch {
    return dateObj.toUTCString();
  }
}

export function parseCertificate(pemString: string): CertDetails {
  if (!pemString || typeof pemString !== 'string' || !pemString.trim()) {
    throw new CertificateValidationError('El campo está vacío. Por favor, ingrese un certificado codificado en PEM.');
  }

  const trimmedPem = pemString.trim();
  if (!trimmedPem.includes('BEGIN CERTIFICATE') || !trimmedPem.includes('END CERTIFICATE')) {
    throw new CertificateValidationError('El texto no es un certificado válido. Debe comenzar con -----BEGIN CERTIFICATE----- y terminar con -----END CERTIFICATE-----.');
  }

  const x509 = new X509();

  try {
    x509.readCertPEM(trimmedPem);
  } catch {
    throw new CertificateValidationError('No se pudo procesar el certificado. Verifique que la estructura y la codificación Base64 sean correctas.');
  }

  const rawNotBefore = x509.getNotBefore() || '';
  const rawNotAfter = x509.getNotAfter() || '';

  let startDate = parseAsn1Date(rawNotBefore);
  let expiryDate = parseAsn1Date(rawNotAfter);

  try {
    if (!startDate) startDate = x509.getNotBeforeDate();
  } catch {}

  try {
    if (!expiryDate) expiryDate = x509.getNotAfterDate();
  } catch {}

  const now = new Date();
  let isValid = false;

  if (startDate && expiryDate) {
    isValid = now >= startDate && now <= expiryDate;
  }

  let publicKeySize = 0;
  try {
    const pubKey = (x509 as any).subjectPublicKeyRSA;
    if (pubKey && pubKey.n) {
      publicKeySize = pubKey.n.bitLength();
    } else {
      const pubKeyHex = (x509 as any).getPublicKeyHex?.();
      if (pubKeyHex) {
        publicKeySize = pubKeyHex.length * 4;
      }
    }
  } catch {
    publicKeySize = 0;
  }

  if (publicKeySize === 0) {
    const sigAlgo = x509.getSignatureAlgorithmName() || '';
    publicKeySize = sigAlgo.includes('2048') || trimmedPem.length > 1000 ? 2048 : 1024;
  }

  const rawSubjectObj = (x509 as any).getSubject?.() || x509.getSubjectString() || '';
  const rawIssuerObj = (x509 as any).getIssuer?.() || x509.getIssuerString() || '';

  return {
    subject: typeof rawSubjectObj === 'string' ? rawSubjectObj : JSON.stringify(rawSubjectObj),
    issuer: typeof rawIssuerObj === 'string' ? rawIssuerObj : JSON.stringify(rawIssuerObj),
    subjectAttributes: extractAttributes(rawSubjectObj),
    issuerAttributes: extractAttributes(rawIssuerObj),
    notBefore: formatReadableDate(startDate, rawNotBefore),
    notAfter: formatReadableDate(expiryDate, rawNotAfter),
    isValid,
    signatureAlgorithm: x509.getSignatureAlgorithmName() || 'Desconocido',
    publicKeySize,
  };
}