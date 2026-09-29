import { describe, it, expect } from 'vitest';
import { createDocumentationPlan } from '../src/generate/planner';
import { ProjectAnalysis } from '../src/types';

describe('DocumentationPlanner Engine', () => {
  const baseAnalysis: ProjectAnalysis = {
    metadata: {
      projectName: 'TestApp',
      rootPath: '/test',
      fileCount: 10,
      scanTimeMs: 10
    },
    repository: { ignoredCount: 0, totalScannedCount: 10 },
    purpose: 'Test purpose',
    features: [],
    structure: { directories: [], projectTree: '' },
    entryPoints: [],
    architecture: [],
    routes: [],
    api: { endpoints: [], controllers: [], middleware: [] },
    data: { databaseTypes: [], models: [] },
    configuration: { environmentVariables: [], configFiles: [] },
    commands: [],
    testing: { frameworks: [], directories: [], types: [], commands: [], evidence: [] },
    deployment: { ci: [], docker: false, hostingProviders: [], commands: [], evidence: [] },
    technologies: []
  };

  it('omits API section when no API evidence exists', () => {
    const plan = createDocumentationPlan(baseAnalysis, 'pro');
    expect(plan.sections.map(s => s.id)).not.toContain('api');
  });

  it('includes API section when API evidence exists', () => {
    const analysis = {
      ...baseAnalysis,
      api: { ...baseAnalysis.api, endpoints: [{ method: 'GET', path: '/test', sourceFile: 'test.ts', evidence: [] }] }
    };
    const plan = createDocumentationPlan(analysis, 'pro');
    expect(plan.sections.map(s => s.id)).toContain('api');
  });

  it('omits Docker section when not detected', () => {
    const plan = createDocumentationPlan(baseAnalysis, 'pro');
    expect(plan.sections.map(s => s.id)).not.toContain('docker');
  });

  it('includes Docker section when detected', () => {
    const analysis = {
      ...baseAnalysis,
      deployment: { ...baseAnalysis.deployment, docker: true }
    };
    const plan = createDocumentationPlan(analysis, 'pro');
    expect(plan.sections.map(s => s.id)).toContain('docker');
  });

  it('includes architecture section only if strong evidence exists', () => {
    const withoutArch = createDocumentationPlan(baseAnalysis, 'pro');
    expect(withoutArch.sections.map(s => s.id)).not.toContain('architecture');

    const withArch = createDocumentationPlan({
      ...baseAnalysis,
      architecture: [{ name: 'Core', description: 'Core logic', files: [], evidence: [] }]
    }, 'pro');
    expect(withArch.sections.map(s => s.id)).toContain('architecture');
  });
});
