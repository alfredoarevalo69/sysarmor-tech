// src/utils/securityOrchestrator.ts

export interface RemediationOption {
  header: string;
  purpose: string;
  genericValue: string;
}

export interface AuditResult {
  module: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  score?: string;
  details: {
    component: string;
    finding: string;
    recommendation: string;
    remediationOptions?: RemediationOption[];
    rawHeaders?: Record<string, string>;
    compliancePercentage?: number;
    [key: string]: any;
  };
  message: string;
}

export interface ExecutiveReport {
  timestamp: string;
  targetDomain: string;
  globalRating: string;
  audits: AuditResult[];
}

export class SecurityOrchestrator {
  private target: string;

  constructor(targetUrl: string) {
    const sanitized = targetUrl.trim();
    this.target = sanitized.startsWith('http://') || sanitized.startsWith('https://') 
      ? sanitized 
      : `https://${sanitized}`;
  }

  public async generateExecutiveReport(): Promise<ExecutiveReport> {
    const timestamp = new Date().toISOString();

    const headerAudit = await this.auditHttpHeaders();
    const sslAudit = await this.auditSslCertificate();

    const audits: AuditResult[] = [headerAudit, sslAudit];
    const globalRating = this.calculateGlobalScore(audits);

    return {
      timestamp,
      targetDomain: this.target,
      globalRating,
      audits,
    };
  }

  private async auditHttpHeaders(): Promise<AuditResult> {
    try {
      const response = await fetch(this.target, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9'
        }
      });

      const rawHeadersRecord: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        rawHeadersRecord[key] = value;
      });

      // Extracción de cabeceras relevantes para análisis inteligente
      const cspHeader = rawHeadersRecord['content-security-policy'] || '';
      const hasHsts = rawHeadersRecord['strict-transport-security'] !== undefined;
      const hasCsp = cspHeader.length > 0;
      const hasContentTypeOptions = rawHeadersRecord['x-content-type-options'] !== undefined;
      
      // Validación inteligente de Clickjacking: acepta X-Frame-Options o la directiva moderna frame-ancestors en CSP
      const hasXFrameHeader = rawHeadersRecord['x-frame-options'] !== undefined;
      const hasFrameAncestors = cspHeader.includes('frame-ancestors');
      const hasClickjackingProtection = hasXFrameHeader || hasFrameAncestors;

      // Definición de controles críticos con su peso ponderado
      const evaluatedControls = [
        { name: 'Content-Security-Policy (CSP)', passed: hasCsp, weight: 35, key: 'content-security-policy' },
        { name: 'Strict-Transport-Security (HSTS)', passed: hasHsts, weight: 35, key: 'strict-transport-security' },
        { name: 'Protección Clickjacking (X-Frame-Options / frame-ancestors)', passed: hasClickjackingProtection, weight: 15, key: 'x-frame-options' },
        { name: 'X-Content-Type-Options', passed: hasContentTypeOptions, weight: 15, key: 'x-content-type-options' }
      ];

      let earnedPoints = 0;
      const remediationOptions: RemediationOption[] = [];

      const allRemediations: Record<string, RemediationOption> = {
        'content-security-policy': {
          header: 'Content-Security-Policy (CSP)',
          purpose: 'Mitiga ataques de Cross-Site Scripting (XSS) y envenenamiento de contenido.',
          genericValue: "default-src 'self'; script-src 'self'; object-src 'none';"
        },
        'strict-transport-security': {
          header: 'Strict-Transport-Security (HSTS)',
          purpose: 'Obliga a los navegadores a utilizar exclusivamente conexiones cifradas (HTTPS).',
          genericValue: 'max-age=31536000; includeSubDomains; preload'
        },
        'x-frame-options': {
          header: 'X-Frame-Options / frame-ancestors',
          purpose: 'Protege contra ataques de enmarcado malicioso (Clickjacking).',
          genericValue: "frame-ancestors 'self' (en CSP) o X-Frame-Options: DENY"
        },
        'x-content-type-options': {
          header: 'X-Content-Type-Options',
          purpose: 'Evita que el navegador realice una autodetección incorrecta del tipo MIME.',
          genericValue: 'nosniff'
        }
      };

      evaluatedControls.forEach(control => {
        if (control.passed) {
          earnedPoints += control.weight;
        } else {
          if (allRemediations[control.key]) {
            remediationOptions.push(allRemediations[control.key]);
          }
        }
      });

      // Asignación de calificación basada en escala analítica y porcentual
      let score = 'F';
      let status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'FAILED';

      if (earnedPoints >= 90) {
        score = 'A';
        status = 'SUCCESS';
      } else if (earnedPoints >= 70) {
        score = 'B';
        status = 'WARNING';
      } else if (earnedPoints >= 50) {
        score = 'C';
        status = 'WARNING';
      } else {
        score = 'F';
        status = 'FAILED';
      }

      const isOptimal = earnedPoints === 100;

      return {
        module: 'Seguridad de Cabeceras HTTP / HTTPS',
        status,
        score,
        details: {
          component: 'Políticas de Hardening Perimetral',
          finding: isOptimal 
            ? 'El servidor implementa el 100% de las directivas de seguridad recomendadas (incluyendo estándares modernos).' 
            : `Postura de hardening parcial (${earnedPoints}% de cumplimiento). Se detectaron controles ausentes.`,
          recommendation: isOptimal 
            ? 'Mantener la configuración actual de seguridad en el servidor de borde.' 
            : 'Integrar los controles faltantes listados abajo para elevar la calificación a nivel óptimo (A).',
          remediationOptions: remediationOptions.length > 0 ? remediationOptions : undefined,
          rawHeaders: rawHeadersRecord,
          compliancePercentage: earnedPoints
        },
        message: `Hardening evaluado con ${earnedPoints}% de efectividad.`
      };
    } catch (error) {
      return {
        module: 'Seguridad de Cabeceras HTTP / HTTPS',
        status: 'FAILED',
        score: 'F',
        details: {
          component: 'Conectividad y Resolución',
          finding: `Imposible completar el análisis de red: ${String(error)}`,
          recommendation: 'Compruebe que el dominio sea públicamente accesible y responda peticiones.'
        },
        message: 'Fallo de conectividad en la auditoría.'
      };
    }
  }

  private async auditSslCertificate(): Promise<AuditResult> {
    const isHttps = this.target.startsWith('https://');

    const remediationOptions: RemediationOption[] = !isHttps ? [{
      header: 'Cifrado de Transporte (HTTPS / TLS)',
      purpose: 'Garantiza la confidencialidad e integridad de los datos en tránsito mediante criptografía asimétrica.',
      genericValue: "Instalar certificado SSL/TLS válido (ej. Let's Encrypt) y habilitar redirección 301 del puerto 80 al 443."
    }] : [];

    return {
      module: 'Criptografía y Protocolo SSL/TLS',
      status: isHttps ? 'SUCCESS' : 'FAILED',
      score: isHttps ? 'A' : 'F',
      details: {
        component: 'Negociación TLS y Cifrado Fuerte',
        finding: isHttps 
          ? 'El canal de comunicación está cifrado mediante protocolos seguros.' 
          : 'El objetivo evaluado no utiliza HTTPS por defecto.',
        recommendation: isHttps 
          ? 'Ninguna acción requerida.' 
          : 'Actualizar la infraestructura para soportar exclusivamente conexiones cifradas.',
        remediationOptions: isHttps ? undefined : remediationOptions
      },
      message: isHttps ? 'Cifrado de transporte activo.' : 'Canal de transporte vulnerable (HTTP plano).'
    };
  }

  private calculateGlobalScore(audits: AuditResult[]): string {
    const scores = audits.map(a => a.score || 'F');
    if (scores.includes('F')) return 'F';
    if (scores.includes('C')) return 'C';
    if (scores.includes('B')) return 'B';
    return 'A';
  }
}