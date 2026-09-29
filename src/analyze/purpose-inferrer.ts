import * as path from 'node:path';
import { DetectedTechnology, ScanResult } from '../types';
import { readTextFileSafe } from '../scanner/reader';

const FORBIDDEN_AI_PHRASES = [
  /leverages/gi,
  /seamlessly integrates/gi,
  /cutting-edge/gi,
  /powerful solution/gi,
  /robust platform/gi,
  /comprehensive solution/gi,
  /modern and scalable/gi,
  /state-of-the-art/gi,
  /revolutionary/gi,
  /highly efficient/gi,
  /easy-to-use/gi,
];

export function cleanProse(text: string): string {
  let cleaned = text;
  for (const pattern of FORBIDDEN_AI_PHRASES) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

export interface ProjectIdentityResult {
  projectName: string;
  description?: string;
  version?: string;
  sourceManifest?: string;
}

export function extractProjectIdentity(scan: ScanResult): ProjectIdentityResult {
  const rootDirName = path.basename(scan.rootPath);
  let projectName = rootDirName;
  let description: string | undefined;
  let version: string | undefined;
  let sourceManifest: string | undefined;

  const validFiles = scan.files.filter(f => f.scope === 'application' || f.scope === 'tooling' || f.scope === 'documentation');

  // 1. package.json (Node.js)
  const pkgEntry = validFiles.find((f) => f.path === 'package.json');
  if (pkgEntry) {
    const res = readTextFileSafe(pkgEntry.absolutePath, pkgEntry.path);
    if (res.content) {
      try {
        const pkg = JSON.parse(res.content);
        if (typeof pkg.name === 'string' && pkg.name.trim()) {
          projectName = pkg.name.trim();
          sourceManifest = 'package.json';
        }
        if (typeof pkg.description === 'string' && pkg.description.trim()) {
          description = pkg.description.trim();
        }
        if (typeof pkg.version === 'string' && pkg.version.trim()) {
          version = pkg.version.trim();
        }
      } catch { /* ignore */ }
    }
  }

  // 2. pyproject.toml (Python)
  if (projectName === rootDirName) {
    const pyproject = validFiles.find((f) => f.path === 'pyproject.toml');
    if (pyproject) {
      const res = readTextFileSafe(pyproject.absolutePath, pyproject.path);
      if (res.content) {
        const nameMatch = res.content.match(/(?:name)\s*=\s*["`']([^"`']+)["`']/i);
        if (nameMatch) {
          projectName = nameMatch[1].trim();
          sourceManifest = 'pyproject.toml';
        }
        const descMatch = res.content.match(/(?:description)\s*=\s*["`']([^"`']+)["`']/i);
        if (descMatch && !description) {
          description = descMatch[1].trim();
        }
        const verMatch = res.content.match(/(?:version)\s*=\s*["`']([^"`']+)["`']/i);
        if (verMatch && !version) {
          version = verMatch[1].trim();
        }
      }
    }
  }

  // 3. Cargo.toml (Rust)
  if (projectName === rootDirName) {
    const cargo = validFiles.find((f) => f.path === 'Cargo.toml');
    if (cargo) {
      const res = readTextFileSafe(cargo.absolutePath, cargo.path);
      if (res.content) {
        const nameMatch = res.content.match(/name\s*=\s*["`']([^"`']+)["`']/i);
        if (nameMatch) {
          projectName = nameMatch[1].trim();
          sourceManifest = 'Cargo.toml';
        }
        const descMatch = res.content.match(/description\s*=\s*["`']([^"`']+)["`']/i);
        if (descMatch && !description) {
          description = descMatch[1].trim();
        }
        const verMatch = res.content.match(/version\s*=\s*["`']([^"`']+)["`']/i);
        if (verMatch && !version) {
          version = verMatch[1].trim();
        }
      }
    }
  }

  // 4. go.mod (Go)
  if (projectName === rootDirName) {
    const gomod = validFiles.find((f) => f.path === 'go.mod');
    if (gomod) {
      const res = readTextFileSafe(gomod.absolutePath, gomod.path);
      if (res.content) {
        const modMatch = res.content.match(/^module\s+(.+)$/m);
        if (modMatch) {
          const modPath = modMatch[1].trim();
          const parts = modPath.split('/');
          projectName = parts[parts.length - 1];
          sourceManifest = 'go.mod';
        }
      }
    }
  }

  // 5. pubspec.yaml (Flutter / Dart)
  if (projectName === rootDirName) {
    const pubspec = validFiles.find((f) => f.path === 'pubspec.yaml');
    if (pubspec) {
      const res = readTextFileSafe(pubspec.absolutePath, pubspec.path);
      if (res.content) {
        const nameMatch = res.content.match(/^name:\s*(.+)$/m);
        if (nameMatch) {
          projectName = nameMatch[1].trim();
          sourceManifest = 'pubspec.yaml';
        }
        const descMatch = res.content.match(/^description:\s*(.+)$/m);
        if (descMatch && !description) {
          description = descMatch[1].trim();
        }
      }
    }
  }

  // 6. pom.xml (Maven)
  if (projectName === rootDirName) {
    const pom = validFiles.find((f) => f.path === 'pom.xml');
    if (pom) {
      const res = readTextFileSafe(pom.absolutePath, pom.path);
      if (res.content) {
        const nameMatch = res.content.match(/<name>([^<]+)<\/name>/i) || res.content.match(/<artifactId>([^<]+)<\/artifactId>/i);
        if (nameMatch) {
          projectName = nameMatch[1].trim();
          sourceManifest = 'pom.xml';
        }
        const descMatch = res.content.match(/<description>([^<]+)<\/description>/i);
        if (descMatch && !description) {
          description = descMatch[1].trim();
        }
      }
    }
  }

  // 7. Gradle settings (build.gradle / settings.gradle)
  if (projectName === rootDirName) {
    const gradleSetting = validFiles.find((f) => f.path === 'settings.gradle' || f.path === 'settings.gradle.kts');
    if (gradleSetting) {
      const res = readTextFileSafe(gradleSetting.absolutePath, gradleSetting.path);
      if (res.content) {
        const rootMatch = res.content.match(/rootProject\.name\s*=\s*['"]([^'"]+)['"]/);
        if (rootMatch) {
          projectName = rootMatch[1].trim();
          sourceManifest = gradleSetting.path;
        }
      }
    }
  }

  return {
    projectName,
    description,
    version,
    sourceManifest,
  };
}

export interface PurposeInferenceResult {
  purpose: string;
  features: string[];
}

export function inferPurposeAndFeatures(
  scan: ScanResult,
  technologies: DetectedTechnology[]
): PurposeInferenceResult {
  const identity = extractProjectIdentity(scan);
  let rawPurpose = identity.description || '';
  const features: string[] = [];

  const validFiles = scan.files.filter(f => f.scope === 'application' || f.scope === 'tooling' || f.scope === 'test' || f.scope === 'generated');

  // Check README if purpose absent from manifest
  if (!rawPurpose) {
    const readmeFile = validFiles.find((f) => /^README(\.(md|txt))?$/i.test(f.path));
    if (readmeFile) {
      const res = readTextFileSafe(readmeFile.absolutePath, readmeFile.path);
      if (res.content) {
        const paragraphs = res.content
          .split(/\n\s*\n/)
          .map((p) => {
            let cleaned = p.replace(/^#+.*$/gm, '').trim();
            cleaned = cleaned.replace(/(?:!\[.*?\]\(.*?\)|<[^>]+>|\[.*?\]\(.*?\)|\|.*?\|)/g, '').trim();
            return cleaned;
          })
          .filter((p) => p.length > 20);

        if (paragraphs.length > 0) {
          rawPurpose = paragraphs[0];
        }
      }
    }
  }

  // Fallback purpose if no description text exists
  const primaryTechs = technologies.filter(t => t.isPrimary).map(t => t.name);
  const techNames = primaryTechs.length > 0 ? primaryTechs.join(', ') : technologies.slice(0, 3).map(t => t.name).join(', ');
  const defaultPurpose = techNames
    ? `Software project built with ${techNames}.`
    : 'Software application repository.';

  const finalPurpose = cleanProse(rawPurpose || defaultPurpose);

  // Extract evidence-based features
  const hasCli = validFiles.some(f => f.path.startsWith('src/cli') || f.path.includes('cmd/') || f.path.endsWith('cli.ts') || f.path.endsWith('cli.js'));
  if (hasCli) {
    features.push('Command-line interface with interactive flags and execution options');
  }

  if (technologies.some((t) => t.id === 'react' || t.id === 'next' || t.id === 'vue' || t.id === 'angular')) {
    features.push('Interactive user interface components and responsive views');
  }

  if (technologies.some((t) => t.id === 'express' || t.id === 'fastapi' || t.id === 'django' || t.id === 'flask' || t.id === 'spring-boot' || t.id === 'go')) {
    features.push('RESTful API service and route handlers');
  }

  if (validFiles.some((f) => f.path.includes('auth') || f.path.includes('jwt') || f.path.includes('login') || f.path.includes('passport'))) {
    features.push('User authentication and request authorization middleware');
  }

  if (scan.fileMap.has('Dockerfile') || scan.fileMap.has('docker-compose.yml') || scan.fileMap.has('compose.yaml')) {
    features.push('Containerized execution with Docker');
  }

  if (validFiles.some((f) => f.path.startsWith('.github/workflows/'))) {
    features.push('Automated CI/CD workflows with GitHub Actions');
  }

  return {
    purpose: finalPurpose,
    features: features.slice(0, 6),
  };
}

