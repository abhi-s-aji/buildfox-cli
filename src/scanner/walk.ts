import * as fs from 'node:fs';
import * as path from 'node:path';
import { DiagnosticMessage, FileEntry, ScanResult } from '../types';
import { isIgnoredDirectory, isSecretFile } from './filters';
import { classifyFileScope } from './classifier';

export interface WalkOptions {
  maxDepth?: number;
  maxFiles?: number;
}

export function scanProject(
  targetDir: string,
  options: WalkOptions = {}
): ScanResult {
  const maxDepth = options.maxDepth ?? 6;
  const maxFiles = options.maxFiles ?? 10000;
  const rootPath = path.resolve(targetDir);

  const files: FileEntry[] = [];
  const fileMap = new Set<string>();
  const diagnostics: DiagnosticMessage[] = [];
  let ignoredCount = 0;
  let totalScannedCount = 0;

  function normalizeRelativePath(rel: string): string {
    return rel.split(path.sep).join('/');
  }

  function walk(currentDir: string, currentDepth: number): void {
    if (currentDepth > maxDepth || files.length >= maxFiles) {
      return;
    }

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err: any) {
      diagnostics.push({
        file: normalizeRelativePath(path.relative(rootPath, currentDir)),
        message: `Could not read directory: ${err?.message || String(err)}`,
        level: 'warning',
      });
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      totalScannedCount++;

      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootPath, fullPath);
      const normalizedPath = normalizeRelativePath(relativePath);

      // Check symlink safety - do NOT follow symlinks
      try {
        const lstat = fs.lstatSync(fullPath);
        if (lstat.isSymbolicLink()) {
          ignoredCount++;
          diagnostics.push({
            file: normalizedPath,
            message: 'Skipped symlink for security',
            level: 'info',
          });
          continue;
        }

        if (lstat.isDirectory()) {
          if (isIgnoredDirectory(entry.name)) {
            ignoredCount++;
            continue;
          }
          files.push({
            path: normalizedPath,
            absolutePath: fullPath,
            size: 0,
            isDirectory: true,
            scope: classifyFileScope(normalizedPath),
          });
          fileMap.add(normalizedPath);
          walk(fullPath, currentDepth + 1);
        } else if (lstat.isFile()) {
          if (isSecretFile(normalizedPath)) {
            ignoredCount++;
            diagnostics.push({
              file: normalizedPath,
              message: 'Secret file skipped',
              level: 'info',
            });
            continue;
          }
          files.push({
            path: normalizedPath,
            absolutePath: fullPath,
            size: lstat.size,
            isDirectory: false,
            scope: classifyFileScope(normalizedPath),
          });
          fileMap.add(normalizedPath);
        }
      } catch (statErr: any) {
        diagnostics.push({
          file: normalizedPath,
          message: `Error inspecting file: ${statErr?.message || String(statErr)}`,
          level: 'warning',
        });
      }
    }
  }

  walk(rootPath, 0);

  return {
    rootPath,
    files,
    fileMap,
    ignoredCount,
    totalScannedCount,
    diagnostics,
  };
}
