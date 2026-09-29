import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export function atomicWriteFile(targetPath: string, content: string): void {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const randSuffix = crypto.randomBytes(4).toString('hex');
  const tempPath = path.join(dir, `.${path.basename(targetPath)}.tmp.${randSuffix}`);

  try {
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, targetPath);
  } catch (err: any) {
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Ignore unlink error
      }
    }
    throw new Error(`Atomic write failed for ${targetPath}: ${err?.message || String(err)}`);
  }
}
