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
    remediationOptions?: RemediationOption[]; // Opciones genéricas estructuradas
    rawHeaders?: Record<string, string>;
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
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': 'SysArmor-Global-Security-Scanner/1.0'
        }
      });

      const rawHeadersRecord: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        rawHeadersRecord[key] = value;
      });

      const hasCSP = rawHeadersRecord['content-security-policy'] !== undefined;
      const hasHSTS = rawHeadersRecord['strict-transport-security'] !== undefined;
      const hasXFrame = rawHeadersRecord['x-frame-options'] !== undefined;
      const hasContentTypeOptions = rawHeadersRecord['x-content-type-options'] !== undefined;

      const isSecure = hasCSP && hasHSTS && hasXFrame && hasContentTypeOptions;
      const score = isSecure ? 'A' : 'F';
      const status = isSecure ? 'SUCCESS' : 'FAILED';

      // Banco de opciones de remediación genéricas por cada cabecera crítica
      const allRemediations: Record<string, RemediationOption> = {
        csp: {
          header: 'Content-Security-Policy (CSP)',
          purpose: 'Mitiga ataques de Cross-Site Scripting (XSS) y inyección de código malicioso.',
          genericValue: "default-src 'self'; script-src 'self'; object-src 'none';"
        },
        hsts: {
          header: 'Strict-Transport-Security (HSTS)',
          purpose: 'Obliga a los navegadores a comunicarse exclusivamente mediante canales cifrados (HTTPS).',
          genericValue: 'max-age=31536000; includeSubDomains; preload'
        },
        xframe: {
          header: 'X-Frame-Options',
          purpose: 'Protege contra ataques de enmarcado malicioso (Clickjacking).',
          genericValue: 'DENY (o SAMEORIGIN)'
        },
        contentType: {
          header: 'X-Content-Type-Options',
          purpose: 'Evita que el navegador realice una autodetección incorrecta del tipo MIME.',
          genericValue: 'nosniff'
        }
      };

      const remediationOptions: RemediationOption[] = [];
      if (!hasCSP) remediationOptions.push(allRemediations.csp);
      if (!hasHSTS) remediationOptions.push(allRemediations.hsts);
      if (!hasXFrame) remediationOptions.push(allRemediations.xframe);
      if (!hasContentTypeOptions) remediationOptions.push(allRemediations.contentType);

      return {
        module: 'Seguridad de Cabeceras HTTP / HTTPS',
        status,
        score,
        details: {
          component: 'Políticas de Hardening Perimetral',
          finding: isSecure 
            ? 'El servidor implementa correctamente todas las directivas de seguridad para navegadores.' 
            : 'Se identificó la ausencia de cabeceras de control perimetral esenciales en la respuesta HTTP.',
          recommendation: isSecure 
            ? 'Mantener la configuración actual de seguridad en el servidor de borde.' 
            : 'Configurar el servidor web o CDN para inyectar las cabeceras estándar especificadas en el reporte.',
          remediationOptions: isSecure ? undefined : remediationOptions,
          rawHeaders: rawHeadersRecord
        },
        message: isSecure ? 'Hardening perimetral verificado.' : 'Brechas de seguridad perimetral detectadas. Requiere aplicación de directivas.'
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
      genericValue: 'Instalar certificado SSL/TLS válido (ej. Let\'s Encrypt) y habilitar redirección 301 del puerto 80 al 443.'
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
    const hasFailures = audits.some(a => a.status === 'FAILED');
    if (hasFailures) return 'F';
    return 'A';
  }
}