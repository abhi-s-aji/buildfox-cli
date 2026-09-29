import { describe, it, expect, afterEach } from 'vitest';
import { createFixture, cleanupFixture } from './fixtures/fixture-setup';
import { scanProject } from '../src/scanner/walk';
import { readTextFileSafe } from '../src/scanner/reader';
import { isSecretFile } from '../src/scanner/filters';
import { parseEnvExampleKeys } from '../src/scanner/safety';

describe('Secret Safety & Environmental Variable Protection', () => {
  afterEach(() => {
    cleanupFixture('test-secrets');
  });

  it('correctly identifies secret file patterns', () => {
    expect(isSecretFile('.env')).toBe(true);
    expect(isSecretFile('.env.local')).toBe(true);
    expect(isSecretFile('.env.production')).toBe(true);
    expect(isSecretFile('id_rsa')).toBe(true);
    expect(isSecretFile('server.key')).toBe(true);
    expect(isSecretFile('cert.pem')).toBe(true);
    expect(isSecretFile('service-account-key.json')).toBe(true);

    expect(isSecretFile('.env.example')).toBe(false);
    expect(isSecretFile('.env.sample')).toBe(false);
    expect(isSecretFile('.env.template')).toBe(false);
  });

  it('never scans or reads secret .env files during project walk', () => {
    const dir = createFixture('test-secrets', {
      '.env': 'SECRET_API_KEY=super_secret_value_12345\nAWS_SECRET_KEY=abcdef123456',
      'id_rsa': '-----BEGIN RSA PRIVATE KEY-----\nMIIE...',
      '.env.example': 'PORT=3000\nDATABASE_URL=\nAPI_KEY=',
      'package.json': '{"name": "secret-test"}',
    });

    const scan = scanProject(dir);
    const scannedPaths = scan.files.map((f) => f.path);

    expect(scannedPaths).not.toContain('.env');
    expect(scannedPaths).not.toContain('id_rsa');
    expect(scannedPaths).toContain('.env.example');

    // Attempting safe read on .env returns warning and null content
    const res = readTextFileSafe(`${dir}/.env`, '.env');
    expect(res.content).toBeNull();
    expect(res.diagnostic?.message).toContain('secret pattern');
  });

  it('safely extracts variable names from .env.example without exposing values', () => {
    const exampleContent = `
# Server config
PORT=8080
HOST=localhost

# Credentials (do not set values here)
DATABASE_URL=postgres://user:pass@localhost:5432/db
SECRET_KEY=secret123
`;

    const keys = parseEnvExampleKeys(exampleContent);
    expect(keys).toEqual(['PORT', 'HOST', 'DATABASE_URL', 'SECRET_KEY']);
  });
});
