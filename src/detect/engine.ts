import { DetectedTechnology, ScanResult, TechRule } from '../types';
import { evaluateSignal } from './signals';

export function detectTechnologies(
  scan: ScanResult,
  rules: TechRule[]
): DetectedTechnology[] {
  const detected: DetectedTechnology[] = [];
  const fileCache = new Map<string, string | null>();

  for (const rule of rules) {
    const scopeScores: Record<string, number> = {
      application: 0, test: 0, fixture: 0, example: 0, generated: 0, tooling: 0, documentation: 0, vendor: 0, unknown: 0
    };
    const evidenceList: string[] = [];

    for (const signal of rule.signals) {
      const res = evaluateSignal(signal, scan, fileCache);
      if (res.matched && res.evidence) {
        evidenceList.push(res.evidence);
        const scope = res.scope || 'unknown';
        scopeScores[scope] = (scopeScores[scope] || 0) + res.weight;
      }
    }

    // Determine primary score (application, tooling, generated, unknown)
    const primaryScore = scopeScores.application + scopeScores.tooling + scopeScores.generated + scopeScores.unknown;
    
    // Determine max score across any single isolated scope (like test, fixture, example)
    const testScore = scopeScores.test;
    const fixtureScore = scopeScores.fixture;
    const exampleScore = scopeScores.example;
    const vendorScore = scopeScores.vendor;

    const maxScore = Math.max(primaryScore, testScore, fixtureScore, exampleScore, vendorScore);
    const confidence = Math.max(0, Math.min(100, Math.round(maxScore)));
    const minScore = rule.minScore ?? 70;

    if (confidence >= 40) { // minimum threshold for 'likely'
      // Determine if this is a primary application technology
      // Tooling technologies can be primary if they are strongly supported in test scope.
      let isPrimary = primaryScore >= 40;
      if (rule.category === 'tooling' && testScore >= 40) {
        isPrimary = true;
      }

      const matchedScopes = Object.entries(scopeScores)
        .filter(([_, score]) => score > 0)
        .map(([scope]) => scope as any);

      detected.push({
        id: rule.id,
        name: rule.name,
        category: rule.category,
        confidence,
        status: confidence >= minScore ? 'detected' : 'likely',
        evidence: evidenceList,
        matchedScopes,
        isPrimary,
      });
    }
  }

  // Sort by confidence descending
  return detected.sort((a, b) => b.confidence - a.confidence);
}
