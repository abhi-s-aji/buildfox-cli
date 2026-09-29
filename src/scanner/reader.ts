import * as fs from 'node:fs';
import { DiagnosticMessage } from '../types';
import { isBinaryFile, isSecretFile } from './filters';

export const MAX_FILE_READ_SIZE = 2 * 1024 * 1024; // 2 MB

export interface ReadFileResult {
  content: string | null;
  diagnostic?: DiagnosticMessage;
}

export function readTextFileSafe(
  absolutePath: string,
  relativePath: string
): ReadFileResult {
  if (isSecretFile(relativePath)) {
    return {
      content: null,
      diagnostic: {
        file: relativePath,
        message: 'File skipped because it matches secret pattern',
        level: 'warning',
      },
    };
  }

  if (isBinaryFile(relativePath)) {
    return {
      content: null,
    };
  }

  try {
    const stat = fs.statSync(absolutePath);
    if (stat.size > MAX_FILE_READ_SIZE) {
      return {
        content: null,
        diagnostic: {
          file: relativePath,
          message: `File skipped because size (${(stat.size / 1024 / 1024).toFixed(2)} MB) exceeds 2 MB limit`,
          level: 'info',
        },
      };
    }

    // Inspect first 512 bytes for binary null bytes
    const fd = fs.openSync(absolutePath, 'r');
    const buffer = Buffer.alloc(Math.min(512, stat.size));
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);

    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return {
          content: null,
          diagnostic: {
            file: relativePath,
            message: 'File skipped because it appears to be binary',
            level: 'info',
          },
        };
      }
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    return { content };
  } catch (error: any) {
    return {
      content: null,
      diagnostic: {
        file: relativePath,
        message: `Could not read file: ${error?.message || String(error)}`,
        level: 'warning',
      },
    };
  }
}
