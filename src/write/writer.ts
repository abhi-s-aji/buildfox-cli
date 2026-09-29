import * as fs from 'node:fs';
import * as path from 'node:path';
import { WriteResult } from '../types';
import { createBackupFile } from './backup';
import { atomicWriteFile } from './atomic-write';

export interface WriteReadmeOptions {
  targetDir: string;
  outputPath?: string;
  content: string;
  allowReplace: boolean;
  dryRun?: boolean;
}

export function writeReadmeFile(options: WriteReadmeOptions): WriteResult {
  const { targetDir, outputPath, content, allowReplace, dryRun } = options;

  if (dryRun) {
    console.log('\n--- DRY RUN OUTPUT ---\n');
    console.log(content);
    console.log('--- END DRY RUN OUTPUT ---\n');
    return {
      outputPath: outputPath || path.join(targetDir, 'README.md'),
      linesWritten: content.split('\n').length,
      bytesWritten: Buffer.byteLength(content, 'utf8'),
      replacedExisting: false,
    };
  }

  let finalPath = outputPath ? path.resolve(targetDir, outputPath) : path.join(targetDir, 'README.md');
  let replacedExisting = false;
  let backupPath: string | undefined;

  if (fs.existsSync(finalPath)) {
    if (allowReplace) {
      backupPath = createBackupFile(finalPath);
      replacedExisting = true;
    } else {
      throw new Error(`Output file already exists and replacement is not allowed: ${finalPath}`);
    }
  }

  atomicWriteFile(finalPath, content);

  const linesWritten = content.split('\n').length;
  const bytesWritten = Buffer.byteLength(content, 'utf8');

  return {
    outputPath: finalPath,
    backupPath,
    linesWritten,
    bytesWritten,
    replacedExisting,
  };
}
