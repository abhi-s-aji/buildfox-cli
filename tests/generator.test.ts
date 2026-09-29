import { describe, it, expect } from 'vitest';
import { ProjectAnalysis } from '../src/types';
import { renderTemplate } from '../src/generate/templates';
import { generateReadmeContent } from '../src/generate/render';
import { generateProjectTree } from '../src/analyze/code-parser';
import { renderDocker, renderContributing } from '../src/generate/content';

describe('README Template Engine & Section Generator', () => {
  const sampleAnalysis: ProjectAnalysis = {
    metadata: {
      projectName: 'DemoApp',
      rootPath: '/path/to/DemoApp',
      fileCount: 5, 
      scanTimeMs: 10
    },
    purpose: 'A web application for managing tasks.',
    features: [{ name: 'Interactive UI components', evidence: [], confidence: 90, relatedFiles: [] }, { name: 'RESTful API service', evidence: [], confidence: 90, relatedFiles: [] }],
    technologies: [
      { id: 'node', name: 'Node.js', category: 'runtime', confidence: 90, status: 'detected', evidence: [], matchedScopes: ['application'] as any, isPrimary: true },
      { id: 'express', name: 'Express', category: 'backend', confidence: 85, status: 'detected', evidence: [], matchedScopes: ['application'] as any, isPrimary: true },
    ],
    packageManager: 'npm',
    commands: [
      { name: 'install', command: 'npm install', category: 'install', sourceFile: 'package.json', evidence: [] },
      { name: 'dev', command: 'npm run dev', category: 'development', sourceFile: 'package.json', evidence: [] },
    ],
    repository: { ignoredCount: 0, totalScannedCount: 5 },
    structure: {
      directories: [],
      projectTree: '.\n├── src/\n└── package.json'
    },
    entryPoints: [],
    architecture: [],
    routes: [],
    api: {
      endpoints: [
        { method: 'GET', path: '/api/tasks', sourceFile: 'src/app.ts', line: 10, evidence: [] },
      ],
      controllers: [],
      middleware: []
    },
    data: {
      databaseTypes: [],
      models: [
        { name: 'Task', sourceFile: 'src/models.ts', fields: ['title', 'completed'], relations: [], evidence: [] },
      ]
    },
    configuration: {
      environmentVariables: ['PORT', 'DATABASE_URL'],
      configFiles: []
    },
    testing: { frameworks: ['Vitest'], directories: [], types: [], commands: [], evidence: [] },
    deployment: { ci: [], docker: false, hostingProviders: [], commands: [], evidence: [] },
    license: 'MIT',
  };

  it('renders Minimal template cleanly', () => {
    const res = generateReadmeContent('minimal', sampleAnalysis);
    expect(res.content).toContain('# DemoApp');
    expect(res.content).toContain('A web application for managing tasks.');
    expect(res.content).toContain('npm install');
    expect(res.content).toContain('License');
  });

  it('renders Standard template with all key sections', () => {
    const res = generateReadmeContent('standard', sampleAnalysis);
    expect(res.content).toContain('# DemoApp');
    expect(res.content).toContain('Features');
    expect(res.content).toContain('Technology Stack');
    expect(res.content).toContain('Environment Variables');
    expect(res.content).toContain('Commands');
    expect(res.content).toContain('Project Structure');
  });

  it('renders Detailed template with API endpoints and database models', () => {
    const res = generateReadmeContent('detailed', sampleAnalysis);
    expect(res.content).toContain('API Endpoints');
    expect(res.content).toContain('`/api/tasks`');
    expect(res.content).toContain('Database Models');
    expect(res.content).toContain('**Task**');
  });

  it('renders Fancy template with Table of Contents and badges', () => {
    const res = generateReadmeContent('fancy', sampleAnalysis);
    expect(res.content).toContain('Table of Contents');
    expect(res.content).toContain('![License]');
  });

  it('renders Pro template with Evidence-backed Architecture', () => {
    const proAnalysis: any = {
      ...sampleAnalysis,
      architecture: [{ id: 'test', name: 'TestLayer', description: 'desc', files: [], dependsOn: [], evidence: [], confidence: 90 }]
    };
    const res = generateReadmeContent('pro', proAnalysis);
    expect(res.content).toContain('Architecture');
    expect(res.content).toContain('TestLayer');
  });

  it('omits API and Models sections when no endpoints or models exist (Conditional Sections)', () => {
    const emptyAnalysis: ProjectAnalysis = {
      ...sampleAnalysis,
      api: { ...sampleAnalysis.api, endpoints: [] },
      data: { ...sampleAnalysis.data, models: [] },
      configuration: { ...sampleAnalysis.configuration, environmentVariables: [] },
    };

    const res = generateReadmeContent('detailed', emptyAnalysis);
    expect(res.content).not.toContain('API Endpoints');
    expect(res.content).not.toContain('Database Models');
    expect(res.content).not.toContain('Environment Configuration');
  });

  describe('Template Differentiation', () => {
    it('Minimal should not contain detailed technical sections', () => {
      const res = generateReadmeContent('minimal', sampleAnalysis);
      expect(res.content).not.toContain('API Reference');
      expect(res.content).not.toContain('Database Models');
      expect(res.content).not.toContain('Architecture');
    });

    it('Standard should contain concise commands and basic API', () => {
      const res = generateReadmeContent('standard', sampleAnalysis);
      expect(res.content).toContain('Commands');
      expect(res.content).toContain('API Endpoints'); // It does contain summary API
      expect(res.content).not.toContain('API Reference'); // It doesn't contain Pro API
    });

    it('Detailed should contain deeper technical information', () => {
      const res = generateReadmeContent('detailed', sampleAnalysis);
      expect(res.content).toContain('API Endpoints');
      expect(res.content).toContain('Database Models');
    });

    it('Fancy should render information using polished presentation', () => {
      const res = generateReadmeContent('fancy', sampleAnalysis);
      expect(res.content).toContain('Table of Contents'); // Fancy specific feature
      expect(res.content).toContain('![License]'); // Badges
      expect(res.content).toContain('API / Key Components');
    });

    it('Pro should render most complete API information and architecture', () => {
      const proAnalysis = {
        ...sampleAnalysis,
        architecture: [{ id: 'test', name: 'TestLayer', description: 'Test description', files: [], dependsOn: [], evidence: [], confidence: 90 }]
      };
      const res = generateReadmeContent('pro', proAnalysis);
      expect(res.content).toContain('API Reference'); // Pro specific title
      expect(res.content).toContain('Architecture');
      expect(res.content).toContain('TestLayer');
    });
  });

  describe('Dynamic Project Tree Depth & Evidence-Driven Renderers', () => {
    it('generateProjectTree correctly expands subdirectories based on maxDepth', () => {
      const scanMock: any = {
        files: [
          { path: 'src/analyze/code-parser.ts', scope: 'application', isDirectory: false },
          { path: 'src/generate/content.ts', scope: 'application', isDirectory: false },
          { path: 'README.md', scope: 'application', isDirectory: false },
        ]
      };

      const tree1 = generateProjectTree(scanMock, 1);
      expect(tree1).toContain('├── src/');
      expect(tree1).not.toContain('analyze');

      const tree2 = generateProjectTree(scanMock, 2);
      expect(tree2).toContain('src/');
      expect(tree2).toContain('analyze/');
      expect(tree2).toContain('generate/');
      expect(tree2).not.toContain('code-parser.ts');

      const tree3 = generateProjectTree(scanMock, 3);
      expect(tree3).toContain('code-parser.ts');
      expect(tree3).toContain('content.ts');
    });

    it('renderDocker returns empty string when docker is false', () => {
      const res = renderDocker({ ...sampleAnalysis, deployment: { ...sampleAnalysis.deployment, docker: false } });
      expect(res).toBe('');
    });

    it('renderDocker includes build and run commands when docker is true', () => {
      const res = renderDocker({ ...sampleAnalysis, deployment: { ...sampleAnalysis.deployment, docker: true } });
      expect(res).toContain('## Docker');
      expect(res).toContain('docker build -t demoapp .');
      expect(res).toContain('docker run demoapp');
    });

    it('renderContributing includes evidence from package manager and testing commands', () => {
      const res = renderContributing({
        ...sampleAnalysis,
        packageManager: 'pnpm',
        testing: { ...sampleAnalysis.testing, commands: [{ name: 'test', command: 'pnpm test', category: 'test', sourceFile: 'package.json', evidence: [] }] }
      });
      expect(res).toContain('pnpm install');
      expect(res).toContain('pnpm test');
    });
  });
});
