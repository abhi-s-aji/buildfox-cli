import { 
  DocumentationPlan, 
  DocumentationPlanSection, 
  ProjectAnalysis, 
  TemplateType,
  DocumentationSectionId,
  DocumentationSectionDepth
} from '../types';

export interface TemplateDefinition {
  id: TemplateType;
  name: string;
  description: string;
  audience: string;
  buildPlan: (analysis: ProjectAnalysis, add: (id: DocumentationSectionId, title: string, depth: DocumentationSectionDepth) => void) => void;
}

const TEMPLATES: Record<TemplateType, TemplateDefinition> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Essential project overview and quick start',
    audience: 'GitHub visitor, casual developer',
    buildPlan: (analysis, add) => {
      add('title', analysis.metadata.projectName, 'summary');
      if (analysis.purpose) add('overview', 'Overview', 'summary');
      if (analysis.features.length > 0) add('features', 'Features', 'summary');
      if (analysis.technologies.filter(t => t.isPrimary).length > 0) add('tech-stack', 'Built With', 'summary');
      if (analysis.commands.length > 0) add('quick-start', 'Quick Start', 'summary');
      if (analysis.license) add('license', 'License', 'summary');
    }
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced professional README for most projects',
    audience: 'Developers, contributors',
    buildPlan: (analysis, add) => {
      add('title', analysis.metadata.projectName, 'summary');
      if (analysis.purpose) add('overview', 'Overview', 'summary');
      if (analysis.features.length > 0) add('features', 'Features', 'summary');
      if (analysis.technologies.length > 0) add('tech-stack', 'Technology Stack', 'summary');
      if (analysis.commands.length > 0) add('quick-start', 'Quick Start', 'summary');
      if (analysis.configuration.configFiles.length > 0) add('configuration', 'Configuration', 'standard');
      if (analysis.configuration.environmentVariables.length > 0) add('environment', 'Environment Variables', 'standard');
      if (analysis.commands.length > 0) add('commands', 'Available Commands', 'standard');
      if (analysis.structure.projectTree) add('structure', 'Project Structure', 'standard');
      if (analysis.architecture.length > 0) add('architecture', 'Architecture', 'standard');
      if (analysis.api.endpoints.length > 0) add('api', 'API Endpoints', 'summary');
      if (analysis.testing.frameworks.length > 0 || analysis.testing.commands.length > 0) add('testing', 'Testing', 'standard');
      if (analysis.deployment.docker) add('docker', 'Docker', 'summary');
      if (analysis.deployment.hostingProviders.length > 0) add('deployment', 'Deployment', 'summary');
      if (analysis.license) add('license', 'License', 'summary');
    }
  },
  detailed: {
    id: 'detailed',
    name: 'Detailed',
    description: 'Deep technical documentation for developers',
    audience: 'Maintainers, engineers onboarding',
    buildPlan: (analysis, add) => {
      add('title', analysis.metadata.projectName, 'summary');
      if (analysis.purpose) add('overview', 'Overview', 'detailed');
      if (analysis.features.length > 0) add('features', 'Features', 'standard');
      if (analysis.technologies.length > 0) add('tech-stack', 'Technology Stack', 'standard');
      if (analysis.commands.length > 0) add('quick-start', 'Quick Start', 'standard');
      if (analysis.configuration.configFiles.length > 0) add('configuration', 'Configuration', 'standard');
      if (analysis.configuration.environmentVariables.length > 0) add('environment', 'Environment Variables', 'standard');
      if (analysis.commands.length > 0) add('commands', 'Available Commands', 'standard');
      if (analysis.structure.projectTree) add('structure', 'Project Structure', 'standard');
      if (analysis.architecture.length > 0) {
        add('architecture', 'Architecture', 'standard');
        add('application-flow', 'Application Flow', 'detailed');
      }
      if (analysis.api.endpoints.length > 0) add('api', 'API Endpoints', 'detailed');
      if (analysis.data.models.length > 0) {
        add('models', 'Database Models', 'detailed');
        add('data-layer', 'Data Layer', 'detailed');
      }
      if (analysis.testing.frameworks.length > 0 || analysis.testing.commands.length > 0) add('testing', 'Testing', 'standard');
      if (analysis.deployment.docker) add('docker', 'Docker', 'detailed');
      if (analysis.deployment.ci.length > 0) add('ci', 'CI/CD', 'detailed');
      if (analysis.deployment.hostingProviders.length > 0) add('deployment', 'Deployment', 'detailed');
      add('troubleshooting', 'Troubleshooting', 'standard');
      add('contributing', 'Contributing', 'standard');
      if (analysis.license) add('license', 'License', 'summary');
    }
  },
  fancy: {
    id: 'fancy',
    name: 'Fancy',
    description: 'Polished, visually structured GitHub README',
    audience: 'GitHub visitors, project stakeholders',
    buildPlan: (analysis, add) => {
      add('title', analysis.metadata.projectName, 'summary');
      add('badges', 'Badges', 'standard');
      if (analysis.purpose) add('overview', 'Overview', 'summary');
      add('toc', 'Table of Contents', 'standard');
      if (analysis.features.length > 0) add('features', 'Highlights', 'standard');
      if (analysis.technologies.length > 0) add('tech-stack', 'Tech Stack', 'standard');
      if (analysis.commands.length > 0) add('quick-start', 'Quick Start', 'standard');
      if (analysis.configuration.configFiles.length > 0) add('configuration', 'Configuration', 'standard');
      if (analysis.structure.projectTree) add('structure', 'Project Structure', 'standard');
      if (analysis.architecture.length > 0) add('architecture', 'Architecture', 'standard');
      if (analysis.api.endpoints.length > 0) add('api', 'API / Key Components', 'summary');
      if (analysis.testing.frameworks.length > 0 || analysis.testing.commands.length > 0) add('testing', 'Testing', 'standard');
      if (analysis.deployment.ci.length > 0) add('ci', 'CI/CD', 'summary');
      if (analysis.deployment.hostingProviders.length > 0 || analysis.deployment.docker) add('deployment', 'Deployment / CI', 'summary');
      add('contributing', 'Contributing', 'summary');
      if (analysis.license) add('license', 'License', 'summary');
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Comprehensive technical reference for complex projects',
    audience: 'Experienced developers, technical reviewers',
    buildPlan: (analysis, add) => {
      add('title', analysis.metadata.projectName, 'summary');
      add('badges', 'Badges', 'detailed');
      if (analysis.purpose) add('overview', 'Overview', 'detailed');
      if (analysis.features.length > 0) add('feature-map', 'Feature Map', 'comprehensive');
      if (analysis.technologies.length > 0) add('tech-stack', 'Technology Stack', 'comprehensive');
      if (analysis.commands.length > 0) add('quick-start', 'Quick Start', 'standard');
      if (analysis.configuration.configFiles.length > 0) add('configuration', 'Configuration', 'standard');
      if (analysis.configuration.environmentVariables.length > 0) add('environment', 'Environment Variables', 'detailed');
      if (analysis.commands.length > 0) add('commands', 'Commands', 'comprehensive');
      if (analysis.structure.projectTree) add('structure', 'Project Structure', 'comprehensive');
      if (analysis.architecture.length > 0) {
        add('architecture', 'Architecture', 'comprehensive');
        add('application-flow', 'Application Flow', 'detailed');
      }
      if (analysis.api.endpoints.length > 0) add('api', 'API Reference', 'comprehensive');
      if (analysis.data.models.length > 0) {
        add('models', 'Database Models', 'comprehensive');
        add('data-layer', 'Data Layer', 'detailed');
      }
      if (analysis.testing.frameworks.length > 0 || analysis.testing.commands.length > 0) add('testing', 'Testing', 'comprehensive');
      if (analysis.deployment.docker) add('docker', 'Docker', 'detailed');
      if (analysis.deployment.ci.length > 0) add('ci', 'CI/CD', 'detailed');
      if (analysis.deployment.hostingProviders.length > 0) add('deployment', 'Deployment', 'detailed');
      add('troubleshooting', 'Troubleshooting', 'standard');
      add('contributing', 'Contributing', 'standard');
      if (analysis.license) add('license', 'License', 'summary');
    }
  }
};

export function createDocumentationPlan(
  analysis: ProjectAnalysis,
  template: TemplateType
): DocumentationPlan {
  const sections: DocumentationPlanSection[] = [];
  let currentPriority = 10;

  const add = (id: DocumentationSectionId, title: string, depth: DocumentationSectionDepth, confidence: number = 100) => {
    sections.push({ 
      id, 
      title, 
      priority: currentPriority, 
      depth, 
      confidence, 
      evidenceSources: [] 
    });
    currentPriority += 10;
  };

  const def = TEMPLATES[template];
  if (!def) {
    throw new Error(`Unknown template: ${template}`);
  }

  def.buildPlan(analysis, add);

  return {
    template,
    sections,
    estimatedLength: sections.length * 15
  };
}
