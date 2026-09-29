import { ScanResult, DependencyGraph, DependencyEdge, ArchitectureLayer, Evidence } from '../types';
import { readTextFileSafe } from '../scanner/reader';
import * as path from 'node:path';

function normalizeImportPath(baseFile: string, importPath: string): string {
  if (importPath.startsWith('.')) {
    const dir = path.dirname(baseFile);
    return path.join(dir, importPath).replace(/\\/g, '/');
  }
  return importPath;
}

export function buildDependencyGraph(scan: ScanResult): DependencyGraph {
  const nodes = new Set<string>();
  const edges: DependencyEdge[] = [];

  const validFiles = scan.files.filter(f => f.scope === 'application' || f.scope === 'tooling' || f.scope === 'test' || f.scope === 'generated');

  for (const file of validFiles) {
    if (file.size > 1000 * 1000) continue; // Skip very large files

    const ext = path.extname(file.path).toLowerCase();
    if (!['.ts', '.js', '.jsx', '.tsx', '.py', '.go', '.java', '.kt', '.dart'].includes(ext)) {
      continue;
    }

    const { content } = readTextFileSafe(file.absolutePath, file.path);
    if (!content) continue;

    nodes.add(file.path);

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // TypeScript / JavaScript
      if (ext.match(/\.[tj]sx?$/)) {
        // import ... from "..."
        // import "..."
        // require("...")
        // await import("...")
        let match = line.match(/(?:import|export)\s+.*?from\s+['"]([^'"]+)['"]/);
        if (!match) match = line.match(/import\s+['"]([^'"]+)['"]/);
        if (!match) match = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (!match) match = line.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);

        if (match) {
          const importPath = match[1];
          if (importPath.startsWith('.')) {
            let resolvedPath = normalizeImportPath(file.path, importPath);
            // Try to resolve exactly or with common extensions
            let targetFile = '';
            const possibleExtensions = ['', '.ts', '.js', '.tsx', '.jsx', '/index.ts', '/index.js'];
            for (const ext of possibleExtensions) {
              const testPath = resolvedPath + ext;
              if (scan.fileMap.has(testPath)) {
                targetFile = testPath;
                break;
              }
            }

            if (targetFile) {
              edges.push({
                from: file.path,
                to: targetFile,
                kind: 'import',
                confidence: 100,
                evidence: {
                  sourceFile: file.path,
                  lineStart: i + 1,
                  signal: 'static import',
                  category: 'dependency',
                  confidence: 100,
                  snippet: line.trim()
                }
              });
              nodes.add(targetFile);
            } else {
              // debug
            }
          }
        }
      }

      // Python
      if (ext === '.py') {
        let match = line.match(/^from\s+([a-zA-Z0-9_.]+)\s+import/);
        if (!match) match = line.match(/^import\s+([a-zA-Z0-9_.]+)/);

        if (match) {
          const importPath = match[1].replace(/\./g, '/');
          let targetFile = '';
          const possibleExtensions = ['.py', '/__init__.py'];
          for (const pExt of possibleExtensions) {
            const testPath = importPath + pExt;
            if (scan.fileMap.has(testPath)) {
              targetFile = testPath;
              break;
            }
          }

          if (targetFile) {
            edges.push({
              from: file.path,
              to: targetFile,
              kind: 'import',
              confidence: 100,
              evidence: {
                sourceFile: file.path,
                lineStart: i + 1,
                signal: 'static import',
                category: 'dependency',
                confidence: 100,
                snippet: line.trim()
              }
            });
            nodes.add(targetFile);
          }
        }
      }

      // Dart / Flutter
      if (ext === '.dart') {
        const match = line.match(/^import\s+['"]([^'"]+)['"]/);
        if (match) {
          const importPath = match[1];
          if (importPath.startsWith('package:')) {
            // Usually package:app_name/... -> maps to lib/...
            const parts = importPath.substring(8).split('/');
            if (parts.length > 1) {
              parts.shift(); // remove app_name
              const testPath = 'lib/' + parts.join('/');
              if (scan.fileMap.has(testPath)) {
                edges.push({
                  from: file.path,
                  to: testPath,
                  kind: 'import',
                  confidence: 90,
                  evidence: {
                    sourceFile: file.path,
                    lineStart: i + 1,
                    signal: 'package import',
                    category: 'dependency',
                    confidence: 90,
                    snippet: line.trim()
                  }
                });
                nodes.add(testPath);
              }
            }
          } else if (!importPath.startsWith('dart:')) {
            const resolvedPath = normalizeImportPath(file.path, importPath);
            if (scan.fileMap.has(resolvedPath)) {
              edges.push({
                from: file.path,
                to: resolvedPath,
                kind: 'import',
                confidence: 100,
                evidence: {
                  sourceFile: file.path,
                  lineStart: i + 1,
                  signal: 'relative import',
                  category: 'dependency',
                  confidence: 100,
                  snippet: line.trim()
                }
              });
              nodes.add(resolvedPath);
            }
          }
        }
      }

      // Go
      if (ext === '.go') {
        let match = line.match(/^\s*import\s+"(.*?)"/);
        if (!match) match = line.match(/^\s*"(.*?)"/); // Inside import () block
        if (match) {
          const importPath = match[1];
          // Simple heuristic: if the import path ends with a directory we have
          const parts = importPath.split('/');
          const dirName = parts[parts.length - 1];
          // Hard to map precisely without go.mod parsing, but we can look for the path segment
          if (importPath.includes('/internal/') || importPath.includes('/pkg/')) {
            // Try to find a matching dir in our tree
            const possibleDirs = Array.from(scan.fileMap.values())
               .filter(f => f.includes('/' + dirName + '/') && f.endsWith('.go'));
            
            if (possibleDirs.length > 0) {
              edges.push({
                from: file.path,
                to: possibleDirs[0], // approximate, to the file level
                kind: 'import',
                confidence: 70,
                evidence: {
                  sourceFile: file.path,
                  lineStart: i + 1,
                  signal: 'go import',
                  category: 'dependency',
                  confidence: 70,
                  snippet: line.trim()
                }
              });
              nodes.add(possibleDirs[0]);
            }
          }
        }
      }
      
      // Java/Kotlin
      if (ext === '.java' || ext === '.kt') {
        const match = line.match(/^import\s+([a-zA-Z0-9_.]+)/);
        if (match) {
          const importPath = match[1].replace(/\./g, '/');
          let targetFile = '';
          const possibleExtensions = ['.java', '.kt'];
          
          for (const pExt of possibleExtensions) {
            // e.g. import com.example.service.UserService -> src/main/java/com/example/service/UserService.java
            // We can search the fileMap for a file ending with importPath + pExt
            const searchSuffix = '/' + importPath + pExt;
            for (const f of scan.fileMap.keys()) {
              if (f.endsWith(searchSuffix)) {
                targetFile = f;
                break;
              }
            }
            if (targetFile) break;
          }

          if (targetFile) {
            edges.push({
              from: file.path,
              to: targetFile,
              kind: 'import',
              confidence: 90,
              evidence: {
                sourceFile: file.path,
                lineStart: i + 1,
                signal: 'java/kt import',
                category: 'dependency',
                confidence: 90,
                snippet: line.trim()
              }
            });
            nodes.add(targetFile);
          }
        }
      }
    }
  }

  return { nodes, edges };
}

export function inferArchitecture(scan: ScanResult, graph: DependencyGraph): ArchitectureLayer[] {
  const layers: ArchitectureLayer[] = [];
  
  // Layer definitions with exact directory segment and filename patterns
  const layerDefs = [
    { id: 'cli', name: 'CLI Layer', keywords: ['cli', 'command', 'cmd', 'bin'], filePattern: /^(?:cli|cmd|bin|main)\.[tj]sx?$/i },
    { id: 'presentation', name: 'Presentation Layer', keywords: ['ui', 'components', 'views', 'screens', 'pages'], filePattern: /^.*(?:component|view|screen|page)\.[tj]sx?$/i },
    { id: 'routing', name: 'Routing Layer', keywords: ['routes', 'router', 'route', 'navigation'], filePattern: /^.*(?:route|router)\.[tj]sx?$/i },
    { id: 'controller', name: 'Controller Layer', keywords: ['controllers', 'controller', 'handlers', 'handler'], filePattern: /^.*(?:controller|handler)\.[tj]sx?$/i },
    { id: 'service', name: 'Service Layer', keywords: ['services', 'service', 'usecases'], filePattern: /^.*(?:service|usecase)\.[tj]sx?$/i },
    { id: 'domain', name: 'Domain Layer', keywords: ['domain', 'core', 'entities'], filePattern: /^.*(?:entity|domain)\.[tj]sx?$/i },
    { id: 'data', name: 'Data Layer', keywords: ['data', 'models', 'model'], filePattern: /^.*(?:model|schema|entity)\.[tj]sx?$/i },
    { id: 'repository', name: 'Repository Layer', keywords: ['repositories', 'repository', 'dao'], filePattern: /^.*(?:repo|repository|dao)\.[tj]sx?$/i },
    { id: 'infrastructure', name: 'Infrastructure Layer', keywords: ['infrastructure', 'infra', 'database'], filePattern: /^.*(?:infra|database|db)\.[tj]sx?$/i },
    { id: 'generation', name: 'Generation Layer', keywords: ['generate', 'generator', 'templates'], filePattern: /^.*(?:generate|generator|template|render)\.[tj]sx?$/i },
    { id: 'analysis', name: 'Analysis Layer', keywords: ['analyze', 'analyzer', 'analysis', 'scanner'], filePattern: /^.*(?:analyze|analyzer|scanner|parser)\.[tj]sx?$/i },
    { id: 'utility', name: 'Utility Layer', keywords: ['utils', 'helpers', 'shared', 'common'], filePattern: /^.*(?:util|helper|shared|common)\.[tj]sx?$/i },
  ];

  // Group files into layers based on exact directory names or file patterns
  const layerFiles = new Map<string, string[]>();
  
  for (const node of graph.nodes) {
    // Exclude test, fixture, vendor files from primary architecture inference
    if (node.match(/(?:^|\/)(?:tests?|__tests__|fixtures?|mocks?|spec|vendor|node_modules)\//i) || node.match(/\.(?:test|spec)\.[tj]sx?$/i)) {
      continue;
    }

    const parts = node.split('/');
    const fileName = parts[parts.length - 1];
    let matchedId = '';
    
    for (const part of parts.slice(0, -1)) {
      const lowerPart = part.toLowerCase();
      // Skip false matches like 'client' matching 'cli'
      if (lowerPart === 'client') continue;

      const def = layerDefs.find(d => d.keywords.includes(lowerPart));
      if (def) {
        matchedId = def.id;
        break;
      }
    }

    // Check filename if directory did not match
    if (!matchedId) {
      const def = layerDefs.find(d => d.filePattern && d.filePattern.test(fileName));
      if (def) {
        matchedId = def.id;
      }
    }
    
    if (matchedId) {
      if (!layerFiles.has(matchedId)) layerFiles.set(matchedId, []);
      layerFiles.get(matchedId)!.push(node);
    }
  }

  // Determine dependencies between layers
  const layerEdges = new Map<string, Set<string>>();
  const evidenceMap = new Map<string, Evidence[]>();

  for (const edge of graph.edges) {
    let fromLayer = '';
    let toLayer = '';

    for (const [layerId, files] of layerFiles.entries()) {
      if (files.includes(edge.from)) fromLayer = layerId;
      if (files.includes(edge.to)) toLayer = layerId;
    }

    if (fromLayer && toLayer && fromLayer !== toLayer) {
      if (!layerEdges.has(fromLayer)) layerEdges.set(fromLayer, new Set());
      layerEdges.get(fromLayer)!.add(toLayer);
      
      const relKey = `${fromLayer}->${toLayer}`;
      if (!evidenceMap.has(relKey)) evidenceMap.set(relKey, []);
      evidenceMap.get(relKey)!.push(edge.evidence);
    }
  }

  // Create ArchitectureLayer objects with evidence-based descriptions
  for (const [layerId, files] of layerFiles.entries()) {
    const def = layerDefs.find(d => d.id === layerId)!;
    
    const dependsOnSet = layerEdges.get(layerId) || new Set();
    const dependsOn = Array.from(dependsOnSet);

    if (files.length > 0) {
      const allEvidence: Evidence[] = [];
      for (const dep of dependsOn) {
        const evs = evidenceMap.get(`${layerId}->${dep}`) || [];
        allEvidence.push(...evs.slice(0, 3));
      }

      if (allEvidence.length === 0) {
         allEvidence.push({
           sourceFile: files[0],
           signal: 'layer directory structure',
           category: 'architecture',
           confidence: 70
         });
      }
      
      // Build evidence-backed description
      const dirs = Array.from(new Set(files.map(f => {
        const p = f.split('/');
        return p.length > 1 ? p.slice(0, -1).join('/') : p[0];
      }))).slice(0, 3);

      const dirStr = dirs.length > 0 ? ` under \`${dirs.join('`, `')}\`` : '';
      const dependsOnNames = dependsOn.map(depId => layerDefs.find(d => d.id === depId)?.name || depId);
      const depStr = dependsOnNames.length > 0 ? ` Imports ${dependsOnNames.join(', ')}.` : '';

      const description = `Orchestrates ${def.name.toLowerCase()} functionality across ${files.length} file${files.length > 1 ? 's' : ''}${dirStr}.${depStr}`;

      layers.push({
        id: layerId,
        name: def.name,
        description,
        files: files.slice(0, 10),
        dependsOn: dependsOn,
        evidence: allEvidence,
        confidence: 85
      });
    }
  }

  return layers;
}
