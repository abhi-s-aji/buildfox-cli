import { describe, it, expect, vi } from 'vitest';
import * as reader from '../src/scanner/reader';
import { buildDependencyGraph } from '../src/analyze/dependency-extractor';
import { ScanResult } from '../src/types';

describe('DependencyGraph Extractor', () => {
  const createMockScan = (files: {path: string, content: string}[]): ScanResult => {
    const fileMap = new Set(files.map(f => f.path));
    
    // Mock the reader
    vi.spyOn(reader, 'readTextFileSafe').mockImplementation((absPath: string, relPath: string) => {
      const f = files.find(x => x.path === relPath);
      return { content: f ? f.content : '' };
    });

    return {
      rootPath: '/test',
      files: files.map(f => ({
        path: f.path,
        absolutePath: '/test/' + f.path,
        size: 100,
        isDirectory: false,
        scope: 'application'
      })),
      fileMap,
      ignoredCount: 0,
      totalScannedCount: files.length,
      diagnostics: []
    };
  };

  it('detects basic relative imports (A imports B)', () => {
    const scan = createMockScan([
      { path: 'src/a.ts', content: `import { b } from './b';` },
      { path: 'src/b.ts', content: `export const b = 1;` }
    ]);
    const graph = buildDependencyGraph(scan);
    
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].from).toBe('src/a.ts');
    expect(graph.edges[0].to).toBe('src/b.ts');
  });

  it('detects cycles', () => {
    const scan = createMockScan([
      { path: 'src/a.ts', content: `import './b';` },
      { path: 'src/b.ts', content: `import './c';` },
      { path: 'src/c.ts', content: `import './a';` }
    ]);
    const graph = buildDependencyGraph(scan);
    
    expect(graph.edges).toHaveLength(3);
    const hasCycle = graph.edges.some(e => e.from === 'src/c.ts' && e.to === 'src/a.ts');
    expect(hasCycle).toBe(true);
  });

  it('ignores unresolved and external imports', () => {
    const scan = createMockScan([
      { path: 'src/a.ts', content: `import react from "react";\nimport "./missing";` }
    ]);
    const graph = buildDependencyGraph(scan);
    expect(graph.edges).toHaveLength(0);
  });
  
  it('detects simple go imports', () => {
    const scan = createMockScan([
      { path: 'cmd/main.go', content: `import "project/internal/service"` },
      { path: 'internal/service/service.go', content: `package service` }
    ]);
    const graph = buildDependencyGraph(scan);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.edges[0].from).toBe('cmd/main.go');
    expect(graph.edges[0].to).toBe('internal/service/service.go');
  });
});

import { inferArchitecture } from '../src/analyze/dependency-extractor';

describe('Architecture Inference Engine', () => {
  it('infers architecture layers and relationships from dependency graph', () => {
    const mockGraph = {
      nodes: new Set(['src/cli.ts', 'src/scanner/walk.ts', 'src/analyze/evidence.ts', 'src/generate/render.ts']),
      edges: [
        { from: 'src/cli.ts', to: 'src/scanner/walk.ts', kind: 'import' as const, confidence: 100, evidence: {} as any },
        { from: 'src/cli.ts', to: 'src/analyze/evidence.ts', kind: 'import' as const, confidence: 100, evidence: {} as any },
        { from: 'src/cli.ts', to: 'src/generate/render.ts', kind: 'import' as const, confidence: 100, evidence: {} as any },
        { from: 'src/analyze/evidence.ts', to: 'src/generate/render.ts', kind: 'import' as const, confidence: 100, evidence: {} as any },
      ]
    };
    
    // Create empty scan for inference
    const scan = { fileMap: new Set(mockGraph.nodes) } as any;
    
    const layers = inferArchitecture(scan, mockGraph);
    
    expect(layers.length).toBeGreaterThan(0);
    const cliLayer = layers.find(l => l.id === 'cli');
    const analyzeLayer = layers.find(l => l.id === 'analysis');
    const genLayer = layers.find(l => l.id === 'generation');
    
    expect(cliLayer).toBeDefined();
    expect(analyzeLayer).toBeDefined();
    
    expect(cliLayer!.dependsOn).toContain('analysis');
    expect(cliLayer!.dependsOn).toContain('generation');
    expect(analyzeLayer!.dependsOn).toContain('generation');
  });
});
