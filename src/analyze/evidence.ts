import * as path from 'node:path';
import { ProjectAnalysis, ScanResult, Evidence, EndpointDetails, DatabaseModelDetails, ProjectCommandDetails } from '../types';
import { loadAllRules } from '../detect/resolve';
import { detectTechnologies } from '../detect/engine';
import { detectCrossCutting } from '../detect/cross-cutting';
import { detectProjectCommands } from './command-detector';
import { extractApiEndpoints } from './api-extractor';
import { extractDatabaseModels } from './model-extractor';
import { extractProjectIdentity, inferPurposeAndFeatures } from './purpose-inferrer';
import { generateProjectTree } from './code-parser';
import { readTextFileSafe } from '../scanner/reader';
import { buildDependencyGraph, inferArchitecture } from './dependency-extractor';

export function analyzeProject(scan: ScanResult): ProjectAnalysis {
  const startTime = Date.now();

  const graph = buildDependencyGraph(scan);
  const layers = inferArchitecture(scan, graph);

  // Pass 1: Repository Inventory
  // Pass 2: Project Metadata
  const identity = extractProjectIdentity(scan);
  const projectName = identity.projectName;
  const projectDescription = identity.description;
  const projectVersion = identity.version;

  // Pass 3: Technologies (Rules Engine)
  const rules = loadAllRules();
  const technologies = detectTechnologies(scan, rules);
  const crossCutting = detectCrossCutting(scan);

  // Pass 4: API Analysis
  const rawEndpoints = extractApiEndpoints(scan);
  const endpoints: EndpointDetails[] = rawEndpoints.map(ep => ({
    method: ep.method,
    path: ep.path,
    sourceFile: ep.file,
    line: ep.line,
    evidence: [{
      sourceFile: ep.file,
      lineStart: ep.line,
      signal: 'regex match',
      category: 'api',
      confidence: 80
    }]
  }));

  // Pass 5: Data Models
  const rawModels = extractDatabaseModels(scan);
  const models: DatabaseModelDetails[] = rawModels.map(m => ({
    name: m.name,
    sourceFile: m.file,
    fields: m.fields || [],
    relations: [],
    framework: m.framework,
    evidence: [{
      sourceFile: m.file,
      signal: 'model declaration',
      category: 'model',
      confidence: 90
    }]
  }));

  // Pass 6: Commands
  const rawCommands = detectProjectCommands(scan, technologies, crossCutting.packageManager);
  const commands: ProjectCommandDetails[] = rawCommands.map(c => ({
    name: c.name,
    command: c.command,
    category: c.category as any,
    sourceFile: 'package.json',
    description: c.description,
    evidence: [{
      sourceFile: 'package.json',
      signal: 'script detection',
      category: 'command',
      confidence: 100
    }]
  }));

  // Pass 7: Features
  const primaryTechnologies = technologies.filter(t => t.isPrimary);
  const { purpose, features: rawFeatures } = inferPurposeAndFeatures(scan, primaryTechnologies);
  const features = rawFeatures.map(f => ({
    name: f,
    evidence: [],
    confidence: 80,
    relatedFiles: []
  }));

  const scanTimeMs = Date.now() - startTime;
  const projectTree = generateProjectTree(scan);
  const projectTreeSummary = generateProjectTree(scan, 1);
  const projectTreeStandard = generateProjectTree(scan, 2);
  const projectTreeDetailed = generateProjectTree(scan, 3);
  const projectTreeComprehensive = generateProjectTree(scan, 4);

  return {
    metadata: {
      projectName,
      description: projectDescription,
      version: projectVersion,
      rootPath: scan.rootPath,
      fileCount: scan.files.length,
      scanTimeMs,
    },
    runtime: primaryTechnologies.find((t) => t.category === 'runtime' || t.category === 'language')?.name || technologies.find((t) => t.category === 'runtime' || t.category === 'language')?.name,
    packageManager: crossCutting.packageManager,
    technologies,
    repository: {
      ignoredCount: scan.ignoredCount,
      totalScannedCount: scan.totalScannedCount
    },
    purpose,
    features,
    structure: {
      directories: [],
      projectTree,
      projectTreeSummary,
      projectTreeStandard,
      projectTreeDetailed,
      projectTreeComprehensive
    },
    entryPoints: [],
    architecture: layers,
    routes: [],
    api: { endpoints, controllers: [], middleware: [] },
    data: { databaseTypes: [], models },
    configuration: {
      environmentVariables: crossCutting.environmentVariables,
      configFiles: []
    },
    commands,
    testing: {
      frameworks: crossCutting.testingFrameworks,
      directories: [],
      types: [],
      commands: commands.filter(c => c.category === 'test'),
      evidence: []
    },
    deployment: {
      ci: crossCutting.buildTools,
      docker: scan.fileMap.has('Dockerfile'),
      hostingProviders: crossCutting.deploymentTools,
      commands: commands.filter(c => c.category === 'build'),
      evidence: []
    },
    license: crossCutting.license,
    monorepo: crossCutting.monorepo.isMonorepo ? crossCutting.monorepo : undefined
  };
}
