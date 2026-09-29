import { ProjectAnalysis, DocumentationPlan } from '../types';
import {
  renderTitle,
  renderBadges,
  renderTableOfContents,
  renderOverview,
  renderFeatures,
  renderTechStackTable,
  renderCommandsSection,
  renderQuickStart,
  renderApiSection,
  renderModelsSection,
  renderDataLayer,
  renderEnvSection,
  renderStructure,
  renderTesting,
  renderArchitecture,
  renderApplicationFlow,
  renderDocker,
  renderCI,
  renderDeployment,
  renderContributing,
  renderSecurity,
  renderTroubleshooting,
  renderLicense
} from './content';

export function renderTemplate(
  plan: DocumentationPlan,
  analysis: ProjectAnalysis
): string {
  let markdown = '';

  for (const section of plan.sections) {
    switch (section.id) {
      case 'title':
        markdown += renderTitle(section.title);
        break;
      case 'badges':
        markdown += renderBadges(analysis);
        break;
      case 'toc':
        markdown += renderTableOfContents(plan.sections.map(s => s.title));
        break;
      case 'overview':
      case 'purpose':
        const asQuote = section.depth === 'summary' || section.depth === 'standard';
        markdown += renderOverview(analysis, section.title, asQuote);
        break;
      case 'quick-start':
        markdown += renderQuickStart(analysis, section.title);
        break;
      case 'features':
      case 'feature-map':
        markdown += renderFeatures(analysis, section.title, section.depth === 'comprehensive' || section.depth === 'detailed' || plan.template === 'fancy');
        break;
      case 'tech-stack':
      case 'runtime':
        markdown += renderTechStackTable(analysis, section.title);
        break;
      case 'architecture':
        markdown += renderArchitecture(analysis, section.title);
        break;
      case 'application-flow':
        markdown += renderApplicationFlow(analysis, section.title);
        break;
      case 'structure':
        markdown += renderStructure(analysis, section.title, section.depth);
        break;
      case 'environment':
      case 'configuration':
        markdown += renderEnvSection(analysis, section.title);
        break;
      case 'prerequisites':
      case 'commands':
        markdown += renderCommandsSection(analysis, section.title);
        break;
      case 'api':
      case 'services':
      case 'middleware':
      case 'routes':
      case 'frontend':
      case 'backend':
        markdown += renderApiSection(analysis, section.title, section.depth === 'comprehensive' || section.depth === 'detailed');
        break;
      case 'models':
        markdown += renderModelsSection(analysis, section.title);
        break;
      case 'data-layer':
        markdown += renderDataLayer(analysis, section.title);
        break;
      case 'testing':
        markdown += renderTesting(analysis, section.title);
        break;
      case 'docker':
        markdown += renderDocker(analysis, section.title);
        break;
      case 'ci':
        markdown += renderCI(analysis, section.title);
        break;
      case 'deployment':
        markdown += renderDeployment(analysis, section.title);
        break;
      case 'contributing':
        markdown += renderContributing(analysis, section.title);
        break;
      case 'security-configuration':
        markdown += renderSecurity(analysis, section.title);
        break;
      case 'troubleshooting':
        markdown += renderTroubleshooting(analysis, section.title);
        break;
      case 'license':
        markdown += renderLicense(analysis, section.title);
        break;
    }
  }

  return markdown.trim() + '\n';
}
