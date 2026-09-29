import { MonorepoPackage, ScanResult } from '../types';
import { readTextFileSafe } from '../scanner/reader';
import { parseEnvExampleKeys } from '../scanner/safety';

export interface CrossCuttingAnalysis {
  packageManager?: string;
  hasDocker: boolean;
  hasGitHubActions: boolean;
  isTypeScript: boolean;
  testingFrameworks: string[];
  buildTools: string[];
  deploymentTools: string[];
  license?: string;
  environmentVariables: string[];
  monorepo: {
    isMonorepo: boolean;
    packages: MonorepoPackage[];
  };
}

export function detectCrossCutting(scan: ScanResult): CrossCuttingAnalysis {
  const validFiles = scan.files.filter(f => f.scope === 'application' || f.scope === 'tooling' || f.scope === 'test' || f.scope === 'generated');
  
  let packageManager: string | undefined;
  if (scan.fileMap.has('pnpm-lock.yaml')) packageManager = 'pnpm';
  else if (scan.fileMap.has('yarn.lock')) packageManager = 'yarn';
  else if (scan.fileMap.has('bun.lockb') || scan.fileMap.has('bun.lock')) packageManager = 'bun';
  else if (scan.fileMap.has('package-lock.json')) packageManager = 'npm';
  else if (scan.fileMap.has('package.json')) packageManager = 'npm';

  const hasDocker =
    scan.fileMap.has('Dockerfile') ||
    scan.fileMap.has('docker-compose.yml') ||
    scan.fileMap.has('docker-compose.yaml') ||
    scan.fileMap.has('compose.yaml');

  const hasGitHubActions = validFiles.some(
    (f) => f.path.startsWith('.github/workflows/') && !f.isDirectory
  );

  const isTypeScript =
    scan.fileMap.has('tsconfig.json') ||
    validFiles.some((f) => !f.isDirectory && /\.(ts|tsx)$/.test(f.path));

  // Detect Testing Frameworks
  const testingFrameworks = new Set<string>();
  if (validFiles.some((f) => /vitest\.config/i.test(f.path))) testingFrameworks.add('Vitest');
  if (validFiles.some((f) => /jest\.config/i.test(f.path))) testingFrameworks.add('Jest');
  if (validFiles.some((f) => /pytest|\.pytest_cache/i.test(f.path))) testingFrameworks.add('Pytest');
  if (validFiles.some((f) => /_test\.go$/i.test(f.path))) testingFrameworks.add('Go Test');
  if (validFiles.some((f) => /test.*\.dart$/i.test(f.path))) testingFrameworks.add('Flutter Test');

  // Check package.json for test runners
  const pkgEntry = validFiles.find((f) => f.path === 'package.json');
  if (pkgEntry) {
    const res = readTextFileSafe(pkgEntry.absolutePath, pkgEntry.path);
    if (res.content) {
      try {
        const pkg = JSON.parse(res.content);
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        if ('vitest' in deps) testingFrameworks.add('Vitest');
        if ('jest' in deps) testingFrameworks.add('Jest');
        if ('mocha' in deps) testingFrameworks.add('Mocha');
        if ('cypress' in deps) testingFrameworks.add('Cypress');
        if ('playwright' in deps || '@playwright/test' in deps) testingFrameworks.add('Playwright');
      } catch {
        // Ignore parse error
      }
    }
  }

  // Detect Build Tools
  const buildTools = new Set<string>();
  if (scan.fileMap.has('vite.config.js') || scan.fileMap.has('vite.config.ts')) buildTools.add('Vite');
  if (scan.fileMap.has('webpack.config.js') || scan.fileMap.has('webpack.config.ts')) buildTools.add('Webpack');
  if (scan.fileMap.has('rollup.config.js') || scan.fileMap.has('tsup.config.ts')) buildTools.add('Rollup/tsup');
  if (scan.fileMap.has('turbo.json')) buildTools.add('Turborepo');
  if (scan.fileMap.has('Makefile')) buildTools.add('Make');

  // Detect Deployment Tools
  const deploymentTools = new Set<string>();
  if (hasDocker) deploymentTools.add('Docker');
  if (scan.fileMap.has('vercel.json')) deploymentTools.add('Vercel');
  if (scan.fileMap.has('netlify.toml')) deploymentTools.add('Netlify');
  if (scan.fileMap.has('fly.toml')) deploymentTools.add('Fly.io');

  // Detect License
  let license: string | undefined;
  const licenseFile = scan.files.find((f) => /^LICENSE(\.(md|txt))?$/i.test(f.path));
  if (licenseFile) {
    const res = readTextFileSafe(licenseFile.absolutePath, licenseFile.path);
    if (res.content) {
      if (res.content.includes('MIT')) license = 'MIT';
      else if (res.content.includes('Apache License')) license = 'Apache 2.0';
      else if (res.content.includes('GNU GENERAL PUBLIC LICENSE')) license = 'GPL-3.0';
      else if (res.content.includes('BSD')) license = 'BSD';
      else license = 'Custom/Other';
    }
  }

  if (!license && pkgEntry) {
    const res = readTextFileSafe(pkgEntry.absolutePath, pkgEntry.path);
    if (res.content) {
      try {
        const pkg = JSON.parse(res.content);
        if (typeof pkg.license === 'string') {
          license = pkg.license;
        }
      } catch {
        // Ignore parse error
      }
    }
  }

  // Safe Environment Variables Extraction
  const envVars: string[] = [];
  const envExample = scan.files.find((f) => /^\.?env\.(example|sample|template)$/i.test(f.path));
  if (envExample) {
    const res = readTextFileSafe(envExample.absolutePath, envExample.path);
    if (res.content) {
      envVars.push(...parseEnvExampleKeys(res.content));
    }
  }

  // Monorepo Detection
  const monorepoPackages: MonorepoPackage[] = [];
  const monorepoDirs = ['apps', 'packages', 'frontend', 'backend', 'client', 'server', 'services'];
  const hasMonorepoIndicator =
    scan.fileMap.has('pnpm-workspace.yaml') ||
    scan.fileMap.has('lerna.json') ||
    scan.fileMap.has('turbo.json');

  let isMonorepo = hasMonorepoIndicator;

  for (const dirName of monorepoDirs) {
    const childPkgs = scan.files.filter(
      (f) => f.path.startsWith(`${dirName}/`) && f.path.endsWith('/package.json')
    );
    if (childPkgs.length > 0) {
      isMonorepo = true;
      for (const childPkg of childPkgs) {
        const pkgPath = childPkg.path.replace('/package.json', '');
        const res = readTextFileSafe(childPkg.absolutePath, childPkg.path);
        let name = pkgPath;
        if (res.content) {
          try {
            const parsed = JSON.parse(res.content);
            if (parsed.name) name = parsed.name;
          } catch {
            // fallback
          }
        }
        monorepoPackages.push({
          name,
          path: pkgPath,
          technologies: [],
        });
      }
    }
  }

  return {
    packageManager,
    hasDocker,
    hasGitHubActions,
    isTypeScript,
    testingFrameworks: Array.from(testingFrameworks),
    buildTools: Array.from(buildTools),
    deploymentTools: Array.from(deploymentTools),
    license,
    environmentVariables: envVars,
    monorepo: {
      isMonorepo,
      packages: monorepoPackages,
    },
  };
}
