import * as fs from 'node:fs';
import * as path from 'node:path';

export function createFixture(fixtureName: string, files: Record<string, string>): string {
  const dirPath = path.join(__dirname, fixtureName);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });

  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(dirPath, relPath);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  return dirPath;
}

export function cleanupFixture(fixtureName: string): void {
  const dirPath = path.join(__dirname, fixtureName);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}
