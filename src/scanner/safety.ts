import { isSecretFile } from './filters';

export function isSafeToRead(relativePath: string): boolean {
  return !isSecretFile(relativePath);
}

/**
 * Extracts environment variable names from .env.example / .env.sample files.
 * Returns only variable keys, ignoring values.
 */
export function parseEnvExampleKeys(content: string): string[] {
  const keys: string[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      // Validate key format (e.g. PORT, DATABASE_URL)
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        keys.push(key);
      }
    }
  }

  return Array.from(new Set(keys));
}
