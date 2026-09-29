import { FileScope } from '../types';

export function classifyFileScope(pathStr: string): FileScope {
  // Normalize path string
  const normalized = pathStr.toLowerCase();
  const segments = normalized.split('/');

  // 1. Fixture
  if (
    segments.includes('fixtures') ||
    segments.includes('fixture') ||
    segments.includes('test-fixtures') ||
    segments.includes('test_fixtures') ||
    segments.includes('__fixtures__')
  ) {
    return 'fixture';
  }

  // 2. Test
  if (
    segments.includes('tests') ||
    segments.includes('test') ||
    segments.includes('__tests__') ||
    segments.includes('spec') ||
    segments.includes('specs') ||
    normalized.endsWith('.test.js') ||
    normalized.endsWith('.test.ts') ||
    normalized.endsWith('.spec.js') ||
    normalized.endsWith('.spec.ts') ||
    normalized.endsWith('_test.go') ||
    normalized.endsWith('_test.py') ||
    normalized.includes('/test_')
  ) {
    return 'test';
  }

  // 3. Example
  if (
    segments.includes('examples') ||
    (segments.includes('example') && !segments.includes('com')) ||
    segments.includes('samples') ||
    segments.includes('sample') ||
    segments.includes('demo') ||
    segments.includes('demos') ||
    segments.includes('playground')
  ) {
    return 'example';
  }

  // 4. Vendor
  if (
    segments.includes('vendor') ||
    segments.includes('third-party') ||
    segments.includes('thirdparty')
  ) {
    return 'vendor';
  }

  // 5. Documentation
  if (
    segments.includes('docs') ||
    segments.includes('documentation') ||
    normalized.endsWith('.md') ||
    normalized.endsWith('.txt')
  ) {
    // Note: requirements.txt is not docs.
    if (!normalized.endsWith('requirements.txt') && !normalized.endsWith('cmakelists.txt')) {
      return 'documentation';
    }
  }

  // 6. Tooling
  if (
    segments.includes('scripts') ||
    segments.includes('tools') ||
    segments.includes('tooling') ||
    segments.includes('config') ||
    segments.includes('.github')
  ) {
    return 'tooling';
  }

  // 7. Generated
  if (
    segments.includes('generated') ||
    segments.includes('gen') ||
    segments.includes('out-tsc')
  ) {
    return 'generated';
  }

  // Default fallback for sources
  return 'application';
}
