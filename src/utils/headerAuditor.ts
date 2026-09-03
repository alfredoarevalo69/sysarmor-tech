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

    // Normalizamos las claves de las cabeceras a minúsculas para una comparación robusta
    const headerKeys = new Set<string>();
    headers.forEach((_, key) => {
      headerKeys.add(key.toLowerCase());
    });

    for (const recommended of this.recommendedHeaders) {
      if (headerKeys.has(recommended)) {
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