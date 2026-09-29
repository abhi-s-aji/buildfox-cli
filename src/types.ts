export type TemplateType = 'minimal' | 'standard' | 'detailed' | 'fancy' | 'pro';

export interface CliOptions {
  targetDir: string;
  yes: boolean;
  dryRun: boolean;
  template?: TemplateType;
  out?: string;
  noAnimation: boolean;
  analyzeOnly: boolean;
  help: boolean;
  version: boolean;
}

export type FileScope = 'application' | 'test' | 'fixture' | 'example' | 'generated' | 'tooling' | 'documentation' | 'vendor' | 'unknown';

export interface FileEntry {
  path: string; // Relative path (normalized unix style '/')
  absolutePath: string;
  size: number;
  isDirectory: boolean;
  scope: FileScope;
}

export interface DiagnosticMessage {
  file?: string;
  message: string;
  level: 'info' | 'warning' | 'error';
}

export interface ScanResult {
  rootPath: string;
  files: FileEntry[];
  fileMap: Set<string>; // For quick O(1) lookup
  ignoredCount: number;
  totalScannedCount: number;
  diagnostics: DiagnosticMessage[];
}

export type SignalType =
  | 'fileExists'
  | 'dependency'
  | 'jsonPath'
  | 'fileContains'
  | 'dirExists'
  | 'globMatch'
  | 'filePattern'
  | 'negative';

export interface RuleSignal {
  type: SignalType;
  target?: string;
  value?: string;
  weight: number;
  description?: string;
}

export interface TechRule {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'mobile' | 'fullstack' | 'runtime' | 'language' | 'tooling';
  signals: RuleSignal[];
  minScore?: number;
}

export interface DetectedTechnology {
  id: string;
  name: string;
  category: string;
  confidence: number; // 0 - 100
  status: 'detected' | 'likely';
  evidence: string[];
  matchedScopes: FileScope[];
  isPrimary: boolean;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  handler?: string;
  file: string;
  line?: number;
  description?: string;
}

export interface DatabaseModel {
  name: string;
  file: string;
  fields?: string[];
  framework?: string;
}

export interface ProjectCommand {
  name: string;
  command: string;
  description?: string;
  category: 'install' | 'run' | 'build' | 'test' | 'lint' | 'other';
}

export interface MonorepoPackage {
  name: string;
  path: string;
  technologies: string[];
}

export interface Evidence {
  sourceFile: string;
  lineStart?: number;
  lineEnd?: number;
  signal: string; // e.g. 'regex match', 'imported library', 'file exists'
  category: string; // e.g. 'technology', 'command', 'feature', 'api', 'model'
  confidence: number; // 0 - 100
  snippet?: string; // Optional context
}

export interface FeatureCandidate {
  name: string;
  description?: string;
  evidence: Evidence[];
  confidence: number;
  relatedFiles: string[];
  relatedRoutes?: string[];
  relatedModels?: string[];
  relatedComponents?: string[];
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  description: string;
  files: string[];
  dependsOn: string[];
  evidence: Evidence[];
  confidence: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  kind: 'import' | 'require' | 'dynamic-import' | 'reference';
  confidence: number;
  evidence: Evidence;
}

export interface DependencyGraph {
  nodes: Set<string>;
  edges: DependencyEdge[];
}

export interface EndpointDetails {
  method: string;
  path: string;
  handler?: string;
  sourceFile: string;
  line?: number;
  controller?: string;
  service?: string;
  requestParams?: string[];
  pathParams?: string[];
  authMiddleware?: boolean;
  description?: string;
  evidence: Evidence[];
}

export interface RouteDetails {
  path: string;
  component: string;
  sourceFile: string;
  parentRoute?: string;
  evidence: Evidence[];
}

export interface ModelRelation {
  type: string;
  targetModel: string;
  sourceField: string;
  evidence: Evidence[];
}

export interface DatabaseModelDetails {
  name: string;
  sourceFile: string;
  fields: string[];
  relations: ModelRelation[];
  framework?: string;
  evidence: Evidence[];
}

export interface ProjectCommandDetails {
  name: string;
  command: string;
  category: 'install' | 'development' | 'test' | 'build' | 'production' | 'other';
  sourceFile: string;
  description?: string;
  evidence: Evidence[];
}

export interface ConfigurationFile {
  path: string;
  purpose: string;
  evidence: Evidence[];
}

export interface TestDetails {
  frameworks: string[];
  directories: string[];
  types: ('unit' | 'integration' | 'e2e' | 'widget')[];
  commands: ProjectCommandDetails[];
  evidence: Evidence[];
}

export interface DeploymentDetails {
  ci: string[];
  docker: boolean;
  hostingProviders: string[];
  commands: ProjectCommandDetails[];
  evidence: Evidence[];
}

export interface EntryPoint {
  path: string;
  framework: string;
  exportedObject?: string;
  majorImports: string[];
  evidence: Evidence[];
}

export interface ProjectAnalysis {
  metadata: {
    projectName: string;
    description?: string;
    version?: string;
    rootPath: string;
    fileCount: number;
    scanTimeMs: number;
  };
  runtime?: string;
  packageManager?: string;
  technologies: DetectedTechnology[]; // Assuming this keeps its current evidence string[] or uses the new one
  
  repository: {
    ignoredCount: number;
    totalScannedCount: number;
  };
  
  purpose: string;
  features: FeatureCandidate[];
  
  structure: {
    directories: string[];
    projectTree: string; // The formatted string for the template
    projectTreeSummary?: string;
    projectTreeStandard?: string;
    projectTreeDetailed?: string;
    projectTreeComprehensive?: string;
  };
  entryPoints: EntryPoint[];
  architecture: ArchitectureLayer[];
  
  routes: RouteDetails[];
  api: {
    endpoints: EndpointDetails[];
    controllers: string[];
    middleware: string[];
  };
  
  data: {
    databaseTypes: string[]; // e.g. PostgreSQL, MongoDB (detected from drivers)
    models: DatabaseModelDetails[];
  };
  
  configuration: {
    environmentVariables: string[]; // Safe keys only
    configFiles: ConfigurationFile[];
  };
  
  commands: ProjectCommandDetails[];
  testing: TestDetails;
  deployment: DeploymentDetails;
  
  license?: string;
  monorepo?: {
    isMonorepo: boolean;
    packages: MonorepoPackage[];
  };
}

export type DocumentationSectionId =
  | 'title'
  | 'overview'
  | 'purpose'
  | 'features'
  | 'feature-map'
  | 'tech-stack'
  | 'runtime'
  | 'prerequisites'
  | 'quick-start'
  | 'configuration'
  | 'environment'
  | 'commands'
  | 'structure'
  | 'architecture'
  | 'application-flow'
  | 'frontend'
  | 'backend'
  | 'routes'
  | 'api'
  | 'services'
  | 'middleware'
  | 'data-layer'
  | 'models'
  | 'testing'
  | 'docker'
  | 'ci'
  | 'deployment'
  | 'security-configuration'
  | 'troubleshooting'
  | 'contributing'
  | 'license'
  | 'badges'
  | 'toc';

export type DocumentationSectionDepth = 'summary' | 'standard' | 'detailed' | 'comprehensive';

export interface DocumentationPlanSection {
  id: DocumentationSectionId;
  priority: number;
  depth: DocumentationSectionDepth;
  evidenceRequired?: boolean;
  
  title: string;
  confidence: number;
  evidenceSources: Evidence[]; // What evidence justified this section
  contentContext?: any; // Structured context passed to renderer
}

export interface DocumentationPlan {
  template: TemplateType;
  sections: DocumentationPlanSection[];
  estimatedLength: number;
}

export interface WriteResult {
  outputPath: string;
  backupPath?: string;
  linesWritten: number;
  bytesWritten: number;
  replacedExisting: boolean;
}
