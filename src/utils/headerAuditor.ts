// src/utils/headerAuditor.ts

export interface AuditResult {
  score: number;
  grade: string;
  missingHeaders: string[];
  presentHeaders: string[];
}

export class HeaderAuditor {
  private readonly recommendedHeaders: string[] = [
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy'
  ];

  /**
   * Audita las cabeceras de respuesta HTTP y calcula un puntaje y calificación.
   */
  public audit(headers: Headers): AuditResult {
    const presentHeaders: string[] = [];
    const missingHeaders: string[] = [];

    // Normalizamos las claves y guardamos sus valores para análisis semántico
    const headerMap = new Map<string, string>();
    headers.forEach((value, key) => {
      headerMap.set(key.toLowerCase(), value);
    });

    // Extraer CSP para validación cruzada (frame-ancestors reemplaza a X-Frame-Options)
    const cspValue = headerMap.get('content-security-policy') || '';
    const hasFrameAncestors = cspValue.toLowerCase().includes('frame-ancestors');

    for (const recommended of this.recommendedHeaders) {
      if (headerMap.has(recommended)) {
        presentHeaders.push(recommended);
      } else if (recommended === 'x-frame-options' && hasFrameAncestors) {
        // Validación semántica: si no está X-Frame-Options pero el CSP implementa frame-ancestors, 
        // consideramos la protección cubierta y evitamos el falso positivo.
        presentHeaders.push(recommended);
      } else {
        missingHeaders.push(recommended);
      }
    }

    const score = this.calculateScore(presentHeaders.length, this.recommendedHeaders.length);
    const grade = this.calculateGrade(score);

    return {
      score,
      grade,
      missingHeaders,
      presentHeaders
    };
  }

  private calculateScore(presentCount: number, totalCount: number): number {
    if (totalCount === 0) return 100;
    return Math.round((presentCount / totalCount) * 100);
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}