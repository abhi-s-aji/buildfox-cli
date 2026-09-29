import { RuleSignal, ScanResult, FileScope } from '../types';
import { readTextFileSafe } from '../scanner/reader';

export interface SignalEvaluationResult {
  matched: boolean;
  weight: number;
  evidence?: string;
  scope?: FileScope;
}

export function evaluateSignal(
  signal: RuleSignal,
  scan: ScanResult,
  cache: Map<string, string | null>
): SignalEvaluationResult {
  const { type, target, value, weight, description } = signal;

  function getFileContent(relPath: string): string | null {
    if (cache.has(relPath)) {
      return cache.get(relPath)!;
    }
    const fileEntry = scan.files.find((f) => f.path === relPath && !f.isDirectory);
    if (!fileEntry) {
      cache.set(relPath, null);
      return null;
    }
    const res = readTextFileSafe(fileEntry.absolutePath, fileEntry.path);
    cache.set(relPath, res.content);
    return res.content;
  }

  switch (type) {
    case 'fileExists': {
      if (!target) return { matched: false, weight: 0 };
      const file = scan.files.find((f) => f.path === target && !f.isDirectory);
      const exists = Boolean(file);
      return {
        matched: exists,
        weight: exists ? weight : 0,
        evidence: exists ? (description || `File ${target} exists`) : undefined,
        scope: exists ? file?.scope : undefined,
      };
    }

    case 'dirExists': {
      if (!target) return { matched: false, weight: 0 };
      const dir = scan.files.find((f) => f.path === target && f.isDirectory);
      const exists = Boolean(dir);
      return {
        matched: exists,
        weight: exists ? weight : 0,
        evidence: exists ? (description || `Directory ${target} exists`) : undefined,
        scope: exists ? dir?.scope : undefined,
      };
    }

    case 'filePattern': {
      if (!target) return { matched: false, weight: 0 };
      const regex = new RegExp(target, 'i');
      const matches = scan.files.filter((f) => !f.isDirectory && regex.test(f.path));
      if (matches.length === 0) return { matched: false, weight: 0 };
      
      const bestMatch = matches.find(m => m.scope === 'application') ||
                        matches.find(m => m.scope === 'tooling') ||
                        matches.find(m => m.scope === 'documentation') ||
                        matches.find(m => m.scope === 'generated') ||
                        matches.find(m => m.scope === 'test') ||
                        matches[0];
                        
      return {
        matched: true,
        weight,
        evidence: description || `Matched pattern ${target}`,
        scope: bestMatch.scope,
      };
    }

    case 'fileContains': {
      if (!target || !value) return { matched: false, weight: 0 };
      const content = getFileContent(target);
      if (!content) return { matched: false, weight: 0 };
      const matched = content.includes(value);
      const file = scan.files.find((f) => f.path === target && !f.isDirectory);
      return {
        matched,
        weight: matched ? weight : 0,
        evidence: matched ? (description || `File ${target} contains "${value}"`) : undefined,
        scope: matched ? file?.scope : undefined,
      };
    }

    case 'dependency': {
      if (!target) return { matched: false, weight: 0 };
      
      const checkDep = (filename: string, checkFn: (content: string) => boolean) => {
        const content = getFileContent(filename);
        if (content && checkFn(content)) {
          const file = scan.files.find(f => f.path === filename && !f.isDirectory);
          return {
            matched: true,
            weight,
            evidence: description || `Dependency "${target}" in ${filename}`,
            scope: file?.scope,
          };
        }
        return null;
      };

      // Check package.json
      const pkgMatch = checkDep('package.json', (content) => {
        try {
          const pkg = JSON.parse(content);
          const allDeps = {
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
            ...(pkg.peerDependencies || {}),
          };
          return target in allDeps;
        } catch { return false; }
      });
      if (pkgMatch) return pkgMatch;

      // Check requirements.txt
      const reqMatch = checkDep('requirements.txt', (content) => new RegExp(`^${target}(\\[|=|>=|<=|>|<|~|\\s|$)`, 'im').test(content));
      if (reqMatch) return reqMatch;

      const pyprojectMatch = checkDep('pyproject.toml', (content) => new RegExp(`"${target}"|'${target}'|${target}\\s*=`, 'i').test(content));
      if (pyprojectMatch) return pyprojectMatch;

      // Check go.mod
      const goModMatch = checkDep('go.mod', (content) => content.includes(target));
      if (goModMatch) return goModMatch;

      // Check pubspec.yaml
      const pubspecMatch = checkDep('pubspec.yaml', (content) => new RegExp(`^\\s*${target}:`, 'm').test(content));
      if (pubspecMatch) return pubspecMatch;

      // Check pom.xml
      const pomMatch = checkDep('pom.xml', (content) => content.includes(target));
      if (pomMatch) return pomMatch;

      // Check build.gradle
      const gradleMatch = checkDep('build.gradle', (content) => content.includes(target)) || 
                          checkDep('build.gradle.kts', (content) => content.includes(target));
      if (gradleMatch) return gradleMatch;

      return { matched: false, weight: 0 };
    }

    case 'jsonPath': {
      if (!target || !value) return { matched: false, weight: 0 };
      const content = getFileContent(target);
      if (!content) return { matched: false, weight: 0 };
      const file = scan.files.find((f) => f.path === target && !f.isDirectory);
      try {
        const parsed = JSON.parse(content);
        const keys = value.split('.');
        let curr: any = parsed;
        for (const k of keys) {
          if (curr && typeof curr === 'object' && k in curr) {
            curr = curr[k];
          } else {
            curr = undefined;
            break;
          }
        }
        const matched = curr !== undefined;
        return {
          matched,
          weight: matched ? weight : 0,
          evidence: matched ? (description || `JSON path ${value} in ${target}`) : undefined,
          scope: matched ? file?.scope : undefined,
        };
      } catch {
        return { matched: false, weight: 0 };
      }
    }

    case 'negative': {
      if (!target) return { matched: false, weight: 0 };
      const file = scan.files.find((f) => f.path === target);
      const exists = Boolean(file);
      return {
        matched: exists,
        weight: exists ? -weight : 0,
        evidence: exists ? (description || `Negative condition matched: ${target}`) : undefined,
        scope: exists ? file?.scope : undefined,
      };
    }

    default:
      return { matched: false, weight: 0 };
  }
}
