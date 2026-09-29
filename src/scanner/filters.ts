import * as path from 'node:path';

export const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.dart_tool',
  '__pycache__',
  'venv',
  '.venv',
  'target',
  '.gradle',
  '.idea',
  '.vscode',
  'vendor',
  'coverage',
  '.cache',
  '.output',
  '.turbo',
  'out',
  'bin',
  'obj',
  '.pytest_cache',
  '.mypy_cache',
]);

export const SECRET_FILE_PATTERNS = [
  /^\.env$/i,
  /^\.env\.(local|development|staging|production|test)$/i,
  /\.pem$/i,
  /\.key$/i,
  /^id_rsa/i,
  /^id_ed25519/i,
  /credentials\.json$/i,
  /service-account.*\.json$/i,
  /id_dsa/i,
  /id_ecdsa/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.asc$/i,
];

export const SAFE_ENV_EXAMPLE_FILES = new Set([
  '.env.example',
  '.env.sample',
  '.env.template',
  'env.example',
  'env.sample',
]);

export const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.pdf',
  '.zip', '.tar', '.gz', '.7z', '.rar', '.jar', '.war', '.ear',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.db', '.sqlite',
  '.pyc', '.pyo', '.class', '.o', '.a', '.ttf', '.woff', '.woff2',
  '.eot', '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac', '.iso',
]);

export function isIgnoredDirectory(dirName: string): boolean {
  return IGNORED_DIRECTORIES.has(dirName.toLowerCase());
}

export function isSecretFile(filename: string): boolean {
  const base = path.basename(filename);
  if (SAFE_ENV_EXAMPLE_FILES.has(base.toLowerCase())) {
    return false;
  }
  return SECRET_FILE_PATTERNS.some((pattern) => pattern.test(base));
}

export function isBinaryFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}
