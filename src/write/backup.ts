import * as fs from 'node:fs';
import * as path from 'node:path';

export function createBackupFile(targetFilePath: string): string | undefined {
  if (!fs.existsSync(targetFilePath)) {
    return undefined;
  }

  const backupPath = `${targetFilePath}.bak`;
  try {
    fs.copyFileSync(targetFilePath, backupPath);
    return backupPath;
  } catch (err: any) {
    throw new Error(`Failed to create backup at ${backupPath}: ${err?.message || String(err)}`);
  }
}
