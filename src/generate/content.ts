import { ProjectAnalysis } from '../types';

export function renderTitle(title: string): string {
  return `# ${title}\n`;
}

export function renderBadges(analysis: ProjectAnalysis): string {
  const badges: string[] = [];
  if (analysis.license) {
    badges.push(`![License](https://img.shields.io/badge/License-${encodeURIComponent(analysis.license)}-blue.svg)`);
  }
  if (analysis.packageManager) {
    badges.push(`![Package Manager](https://img.shields.io/badge/Package_Manager-${analysis.packageManager}-informational)`);
  }
  const primaryTechs = analysis.technologies.filter(t => t.isPrimary);
  for (const tech of primaryTechs.slice(0, 3)) {
    badges.push(`![${tech.name}](https://img.shields.io/badge/Stack-${encodeURIComponent(tech.name)}-brightgreen)`);
  }
  return badges.length > 0 ? badges.join(' ') + '\n\n' : '';
}

export function renderTableOfContents(sections: string[]): string {
  let markdown = '## Table of Contents\n\n';
  for (const sec of sections) {
    if (sec === 'Table of Contents' || sec === 'Badges') continue;
    const slug = sec.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    markdown += `- [${sec}](#${slug})\n`;
  }
  return markdown + '\n';
}

export function renderOverview(analysis: ProjectAnalysis, title = 'Overview', asBlockquote = false): string {
  let md = asBlockquote ? `> ${analysis.purpose}\n\n` : `## ${title}\n\n${analysis.purpose}\n\n`;
  return md;
}

export function renderFeatures(analysis: ProjectAnalysis, title = 'Features', useTable = false): string {
  if (analysis.features.length === 0) return '';
  let markdown = `## ${title}\n\n`;
  if (useTable) {
    markdown += '| Feature | Confidence | Source / Context |\n';
    markdown += '| :--- | :--- | :--- |\n';
    for (const feat of analysis.features) {
      markdown += `| **${feat.name}** | ${feat.confidence}% | Evidence-backed signal |\n`;
    }
  } else {
    for (const feat of analysis.features) {
      markdown += `- **${feat.name}**\n`;
    }
  }
  return markdown + '\n';
}

export function renderTechStackTable(analysis: ProjectAnalysis, title = 'Technology Stack'): string {
  const primaryTechs = analysis.technologies.filter(t => t.isPrimary);
  if (primaryTechs.length === 0) return '';
  let markdown = `## ${title}\n\n`;
  markdown += '| Technology | Category | Confidence |\n';
  markdown += '| :--- | :--- | :--- |\n';
  for (const tech of primaryTechs) {
    markdown += `| **${tech.name}** | ${tech.category} | ${tech.confidence}% |\n`;
  }
  return markdown + '\n';
}

export function renderCommandsSection(analysis: ProjectAnalysis, title = 'Getting Started'): string {
  if (analysis.commands.length === 0) return '';
  let markdown = `## ${title}\n\n`;

  const installCmd = analysis.commands.find((c) => c.category === 'install');
  if (installCmd) {
    markdown += '### Prerequisites & Installation\n\n```bash\n' + installCmd.command + '\n```\n\n';
  }

  const runCmds = analysis.commands.filter((c) => c.category === 'development');
  if (runCmds.length > 0) {
    markdown += '### Running the Application\n\n```bash\n';
    for (const cmd of runCmds) {
      markdown += `${cmd.command}\n`;
    }
    markdown += '```\n\n';
  }

  const buildCmds = analysis.commands.filter((c) => c.category === 'build');
  if (buildCmds.length > 0) {
    markdown += '### Building for Production\n\n```bash\n';
    for (const cmd of buildCmds) {
      markdown += `${cmd.command}\n`;
    }
    markdown += '```\n\n';
  }

  return markdown;
}

export function renderQuickStart(analysis: ProjectAnalysis, title = 'Quick Start'): string {
  if (analysis.commands.length === 0) return '';
  let markdown = `## ${title}\n\n` + '```bash\n';
  for (const cmd of analysis.commands.slice(0, 3)) {
    markdown += `${cmd.command}\n`;
  }
  markdown += '```\n\n';
  return markdown;
}

export function renderApiSection(analysis: ProjectAnalysis, title = 'API Endpoints', detailed = false): string {
  if (analysis.api.endpoints.length === 0) return '';
  let markdown = `## ${title}\n\n`;
  if (detailed) {
    markdown += '| Method | Endpoint Path | Handler | Source File |\n';
    markdown += '| :--- | :--- | :--- | :--- |\n';
    for (const ep of analysis.api.endpoints) {
      const handlerStr = ep.handler ? `\`${ep.handler}\`` : '—';
      markdown += `| \`${ep.method}\` | \`${ep.path}\` | ${handlerStr} | \`${ep.sourceFile}:${ep.line || 1}\` |\n`;
    }
  } else {
    markdown += '| Method | Endpoint Path | Source File |\n';
    markdown += '| :--- | :--- | :--- |\n';
    for (const ep of analysis.api.endpoints) {
      markdown += `| \`${ep.method}\` | \`${ep.path}\` | \`${ep.sourceFile}:${ep.line || 1}\` |\n`;
    }
  }
  return markdown + '\n';
}

export function renderModelsSection(analysis: ProjectAnalysis, title = 'Database Models'): string {
  if (analysis.data.models.length === 0) return '';
  let markdown = `## ${title}\n\n`;
  for (const m of analysis.data.models) {
    const fieldsStr = m.fields && m.fields.length > 0 ? ` (${m.fields.slice(0, 4).join(', ')}${m.fields.length > 4 ? ', ...' : ''})` : '';
    markdown += `- **${m.name}**${fieldsStr} - *${m.framework || 'Model'} in \`${m.sourceFile}\`*\n`;
  }
  return markdown + '\n';
}

export function renderDataLayer(analysis: ProjectAnalysis, title = 'Data Layer'): string {
  if (analysis.data.models.length === 0 && analysis.data.databaseTypes.length === 0) return '';
  let md = `## ${title}\n\n`;
  const dbTypes = analysis.data.databaseTypes.length > 0 ? analysis.data.databaseTypes.join(', ') : 'Configured Persistence Engine';
  md += `Data access is organized through **${dbTypes}**.\n\n`;
  if (analysis.data.models.length > 0) {
    const frameworks = Array.from(new Set(analysis.data.models.map(m => m.framework).filter(Boolean)));
    const fwStr = frameworks.length > 0 ? frameworks.join(', ') : 'ORM';
    md += `- **ORM / Mapping**: ${fwStr}\n`;
    md += `- **Managed Entities**: ${analysis.data.models.length} model definitions\n`;
    md += `- **Primary Source Files**: \`${Array.from(new Set(analysis.data.models.map(m => m.sourceFile))).join('`, `')}\`\n\n`;
  }
  return md;
}

export function renderEnvSection(analysis: ProjectAnalysis, title = 'Environment Configuration'): string {
  if (analysis.configuration.environmentVariables.length === 0) return '';
  let markdown = `## ${title}\n\n`;
  markdown += 'Create a `.env` file in the root directory with the following variables:\n\n';
  markdown += '```env\n';
  for (const key of analysis.configuration.environmentVariables) {
    markdown += `${key}=\n`;
  }
  markdown += '```\n\n';
  return markdown;
}

export function renderStructure(analysis: ProjectAnalysis, title = 'Project Structure', depth: string = 'standard'): string {
  let tree = analysis.structure.projectTree; // fallback
  if (depth === 'summary' && analysis.structure.projectTreeSummary) tree = analysis.structure.projectTreeSummary;
  if (depth === 'standard' && analysis.structure.projectTreeStandard) tree = analysis.structure.projectTreeStandard;
  if (depth === 'detailed' && analysis.structure.projectTreeDetailed) tree = analysis.structure.projectTreeDetailed;
  if (depth === 'comprehensive' && analysis.structure.projectTreeComprehensive) tree = analysis.structure.projectTreeComprehensive;

  if (!tree) return '';
  return `## ${title}\n\n\`\`\`text\n${tree}\n\`\`\`\n\n`;
}

export function renderTesting(analysis: ProjectAnalysis, title = 'Testing'): string {
  let md = `## ${title}\n\n`;
  if (analysis.testing.frameworks.length > 0) {
    md += `This project uses **${analysis.testing.frameworks.join(', ')}** for testing.\n\n`;
  }
  if (analysis.testing.commands.length > 0) {
    md += '### Run Tests\n\n```bash\n';
    for (const cmd of analysis.testing.commands) {
      md += `${cmd.command}\n`;
    }
    md += '```\n\n';
  }
  return md;
}

export function renderArchitecture(analysis: ProjectAnalysis, title = 'Architecture'): string {
  if (!analysis.architecture || analysis.architecture.length === 0) return '';
  
  let md = `## ${title}\n\n`;

  const relationships = analysis.architecture.filter(l => l.dependsOn && l.dependsOn.length > 0);
  
  if (relationships.length > 0) {
    md += '### Structural Relationships\n\n```text\n';
    for (const layer of relationships) {
      for (const dep of layer.dependsOn) {
        const targetLayer = analysis.architecture.find(l => l.id === dep);
        if (targetLayer) {
          md += `${layer.name} → ${targetLayer.name}\n`;
        }
      }
    }
    md += '```\n\n';
  }

  md += '### Component Layers\n\n';
  for (const layer of analysis.architecture) {
    md += `- **${layer.name}**: ${layer.description}\n`;
  }
  md += '\n';

  return md;
}

export function renderApplicationFlow(analysis: ProjectAnalysis, title = 'Application Flow'): string {
  if (!analysis.architecture || analysis.architecture.length === 0) return '';
  
  // Check if we actually have meaningful relationships to form a flow
  const hasRelationships = analysis.architecture.some(l => l.dependsOn && l.dependsOn.length > 0);
  if (!hasRelationships) return '';

  let md = `## ${title}\n\n`;
  
  // Construct execution order based on layer dependencies
  const layerMap = new Map(analysis.architecture.map(l => [l.id, l]));
  const orderedLayers: string[] = [];

  // Start with entry/client/presentation layers
  const topLayerIds = ['cli', 'routing', 'presentation', 'controller'].filter(id => layerMap.has(id));
  if (topLayerIds.length === 0 && analysis.architecture.length > 0) {
    topLayerIds.push(analysis.architecture[0].id);
  }

  const visited = new Set<string>();
  const queue = [...topLayerIds];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    orderedLayers.push(currentId);

    const layer = layerMap.get(currentId);
    if (layer && layer.dependsOn) {
      for (const depId of layer.dependsOn) {
        if (!visited.has(depId)) queue.push(depId);
      }
    }
  }

  // Add any remaining unvisited layers
  for (const layer of analysis.architecture) {
    if (!visited.has(layer.id)) orderedLayers.push(layer.id);
  }

  if (orderedLayers.length > 1) {
    md += '### Execution Order\n\n```text\n';
    const names = orderedLayers.map(id => layerMap.get(id)?.name || id);
    md += names.join(' → ') + '\n';
    md += '```\n\n';
  }

  md += '### Flow Steps\n\n';
  orderedLayers.forEach((id, idx) => {
    const layer = layerMap.get(id);
    if (layer) {
      const fileSample = layer.files.length > 0 ? ` (\`${layer.files.slice(0, 2).join('`, `')}\`)` : '';
      
      let stepDescription = layer.description || '';
      if (!stepDescription) {
        switch (id) {
          case 'cli': stepDescription = 'Initiates application startup based on command-line inputs'; break;
          case 'presentation': stepDescription = 'Receives user interactions and coordinates view updates'; break;
          case 'routing': stepDescription = 'Parses incoming requests and routes them to appropriate handlers'; break;
          case 'controller': stepDescription = 'Validates request context and delegates to business services'; break;
          case 'service': stepDescription = 'Executes core business logic and orchestrates domain operations'; break;
          case 'repository': stepDescription = 'Abstracts data access and queries underlying storage'; break;
          case 'data': stepDescription = 'Manages data persistence and schema interactions'; break;
          case 'analysis': stepDescription = 'Performs static analysis and extracts project metadata'; break;
          case 'generation': stepDescription = 'Constructs output artifacts from processed models'; break;
          default: stepDescription = 'Processes operations specific to its domain'; break;
        }

        const deps = layer.dependsOn.map(depId => layerMap.get(depId)?.name).filter(Boolean);
        if (deps.length > 0) {
          stepDescription += `, passing execution control to ${deps.join(', ')}`;
        } else {
          stepDescription += ` and resolves the execution path`;
        }
      }

      md += `${idx + 1}. **${layer.name}**: ${stepDescription}${fileSample}.\n`;
    }
  });
  md += '\n';

  return md;
}

export function renderDocker(analysis: ProjectAnalysis, title = 'Docker'): string {
  if (!analysis.deployment.docker) return '';
  const pkgName = (analysis.metadata.projectName || 'app').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return `## ${title}\n\nThis project includes Docker configuration for containerized execution.\n\n### Build and Run with Docker\n\n\`\`\`bash\ndocker build -t ${pkgName} .\ndocker run ${pkgName}\n\`\`\`\n\n`;
}

export function renderCI(analysis: ProjectAnalysis, title = 'CI/CD'): string {
  if (!analysis.deployment.ci || analysis.deployment.ci.length === 0) return '';
  return `## ${title}\n\nThis project uses **${analysis.deployment.ci.join(', ')}** for continuous integration and deployment.\n\n`;
}

export function renderDeployment(analysis: ProjectAnalysis, title = 'Deployment'): string {
  if (!analysis.deployment.hostingProviders || analysis.deployment.hostingProviders.length === 0) return '';
  return `## ${title}\n\nThis project is configured for deployment via **${analysis.deployment.hostingProviders.join(', ')}**.\n\n`;
}

export function renderContributing(analysis: ProjectAnalysis, title = 'Contributing'): string {
  let md = `## ${title}\n\nContributions are welcome! Follow these steps to contribute:\n\n`;
  md += `1. Fork the repository and create your feature branch from main.\n`;
  if (analysis.packageManager) {
    md += `2. Install dependencies: \`${analysis.packageManager} install\`.\n`;
  } else {
    md += `2. Install project dependencies.\n`;
  }
  if (analysis.testing.commands.length > 0) {
    md += `3. Run tests before submitting: \`${analysis.testing.commands[0].command}\`.\n`;
  } else {
    md += `3. Verify changes with unit and integration tests.\n`;
  }
  md += `4. Open a pull request with a detailed description of your changes.\n\n`;
  return md;
}

export function renderSecurity(analysis: ProjectAnalysis, title = 'Security Configuration'): string {
  if (analysis.configuration.environmentVariables.length === 0) return '';
  return `## ${title}\n\nSensitive configuration keys are isolated via environment variables. Ensure production deployments define all required environment keys securely.\n\n`;
}

export function renderTroubleshooting(analysis: ProjectAnalysis, title = 'Troubleshooting'): string {
  return '';
}

export function renderLicense(analysis: ProjectAnalysis, title = 'License'): string {
  if (!analysis.license) return '';
  return `## ${title}\n\nThis project is licensed under the ${analysis.license} License.\n`;
}
