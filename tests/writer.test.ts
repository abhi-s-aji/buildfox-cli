import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createFixture, cleanupFixture } from './fixtures/fixture-setup';
import { writeReadmeFile } from '../src/write/writer';

describe('Safe Writer & Backup Engine', () => {
  afterEach(() => {
    cleanupFixture('test-writer');
  });

  it('performs atomic write when creating new README.md', () => {
    const dir = createFixture('test-writer', {});
    const targetPath = path.join(dir, 'README.md');

    const res = writeReadmeFile({
      targetDir: dir,
      content: '# New README\nContent here.',
      allowReplace: false,
    });

    expect(fs.existsSync(targetPath)).toBe(true);
    expect(fs.readFileSync(targetPath, 'utf8')).toBe('# New README\nContent here.');
    expect(res.replacedExisting).toBe(false);
    expect(res.backupPath).toBeUndefined();
  });

  it('creates .bak backup when replacing existing README.md', () => {
    const dir = createFixture('test-writer', {
      'README.md': '# Original README Content',
    });
    const targetPath = path.join(dir, 'README.md');
    const backupPath = path.join(dir, 'README.md.bak');

    const res = writeReadmeFile({
      targetDir: dir,
      content: '# Overwritten README',
      allowReplace: true,
    });

    expect(res.replacedExisting).toBe(true);
    expect(fs.existsSync(backupPath)).toBe(true);
    expect(fs.readFileSync(backupPath, 'utf8')).toBe('# Original README Content');
    expect(fs.readFileSync(targetPath, 'utf8')).toBe('# Overwritten README');
  });

  it('throws an error when replacing existing README is refused', () => {
    const dir = createFixture('test-writer', {
      'README.md': '# Original Content Untouched',
    });

    expect(() => {
      writeReadmeFile({
        targetDir: dir,
        content: '# Alternative BuildFox README',
        allowReplace: false,
      });
    }).toThrow(/Output file already exists and replacement is not allowed/);

    expect(fs.existsSync(path.join(dir, 'README.md'))).toBe(true);
    expect(fs.readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe('# Original Content Untouched');
  });

  it('writes NOTHING when dryRun option is enabled', () => {
    const dir = createFixture('test-writer', {});

    const res = writeReadmeFile({
      targetDir: dir,
      content: '# Dry Run Content',
      allowReplace: false,
      dryRun: true,
    });

    expect(fs.existsSync(path.join(dir, 'README.md'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'BuildFox-README.md'))).toBe(false);
  });
});
