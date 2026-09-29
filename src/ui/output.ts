import { ProjectAnalysis, TemplateType } from '../types';
import { theme, sanitizeTerminalOutput } from './theme';

export function printError(title: string, detail?: string): void {
  console.log(`\n${theme.error('✖ Error:')} ${theme.bold(sanitizeTerminalOutput(title))}`);
  if (detail) {
    console.log(theme.dim(sanitizeTerminalOutput(detail)));
  }
}

export function printWarning(message: string): void {
  console.log(`${theme.warning('⚠ Warning:')} ${sanitizeTerminalOutput(message)}`);
}

export function printSuccess(message: string): void {
  console.log(`${theme.success('✔ Success:')} ${sanitizeTerminalOutput(message)}`);
}

export function printAnalysisSummary(analysis: ProjectAnalysis): void {
  console.log('\n' + theme.bold('Project Analysis Summary:'));
  console.log(`  ${theme.dim('Project Name:')} ${theme.accent(sanitizeTerminalOutput(analysis.metadata.projectName))}`);
  if (analysis.purpose) {
    console.log(`  ${theme.dim('Purpose:')}      ${sanitizeTerminalOutput(analysis.purpose)}`);
  }

  const primaryTechs = analysis.technologies.filter(t => t.isPrimary);
  if (primaryTechs.length > 0) {
    console.log(`\n  ${theme.bold('Detected Stacks & Frameworks:')}`);
    for (const tech of primaryTechs) {
      const badge = tech.status === 'detected' ? theme.statusDetected() : theme.statusLikely();
      console.log(`    ${badge} ${theme.bold(tech.name)} ${theme.dim(`(${tech.confidence}% confidence)`)}`);
    }
  }

  if (analysis.features.length > 0) {
    console.log(`\n  ${theme.bold('Detected Features:')}`);
    for (const feat of analysis.features.slice(0, 5)) {
      console.log(`    ${theme.accent('•')} ${sanitizeTerminalOutput(feat.name)}`);
    }
  }

  if (analysis.commands.length > 0) {
    console.log(`\n  ${theme.bold('Detected Commands:')}`);
    for (const cmd of analysis.commands.slice(0, 5)) {
      console.log(`    ${theme.dim('$')} ${theme.accent(cmd.command)} ${theme.dim(`(# ${cmd.name})`)}`);
    }
  }

  if (analysis.api.endpoints.length > 0) {
    console.log(`\n  ${theme.bold('Detected API Endpoints:')} ${theme.dim(`(${analysis.api.endpoints.length} endpoints found)`)}`);
    for (const ep of analysis.api.endpoints.slice(0, 4)) {
      console.log(`    ${theme.accent(ep.method.padEnd(6))} ${ep.path}`);
    }
    if (analysis.api.endpoints.length > 4) {
      console.log(`    ${theme.dim(`... and ${analysis.api.endpoints.length - 4} more`)}`);
    }
  }

  if (analysis.data.models.length > 0) {
    console.log(`\n  ${theme.bold('Detected Database Models:')} ${theme.dim(`(${analysis.data.models.length} models found)`)}`);
    for (const m of analysis.data.models.slice(0, 4)) {
      console.log(`    ${theme.accent('•')} ${m.name} ${theme.dim(`(in ${m.sourceFile})`)}`);
    }
  }

  if (analysis.architecture && analysis.architecture.length > 0) {
    console.log(`\n  ${theme.bold('Architecture:')}`);
    console.log(`    ${theme.dim('Layers:')}`);
    for (const layer of analysis.architecture) {
      console.log(`      ${theme.accent(layer.name)} ${theme.dim(`(${layer.files.length} files, ${layer.confidence}% confidence)`)}`);
    }
    
    const relationships = analysis.architecture.filter(l => l.dependsOn && l.dependsOn.length > 0);
    if (relationships.length > 0) {
      console.log(`\n    ${theme.dim('Relationships:')}`);
      for (const layer of relationships) {
        for (const dep of layer.dependsOn) {
          const targetLayer = analysis.architecture.find(l => l.id === dep);
          if (targetLayer) {
            console.log(`      ${layer.name} ${theme.accent('→')} ${targetLayer.name}`);
          }
        }
      }
    }
  }

  console.log();
}

export function printPreviewSummary(
  template: TemplateType,
  outputPath: string,
  lineCount: number,
  sections: string[]
): void {
  console.log(theme.bold('README Preview Summary:'));
  console.log(`  ${theme.dim('Template:')} ${theme.accent(template.toUpperCase())}`);
  console.log(`  ${theme.dim('Output File:')} ${theme.accent(sanitizeTerminalOutput(outputPath))}`);
  console.log(`  ${theme.dim('Estimated Lines:')} ${theme.bold(lineCount.toString())}`);
  console.log(`  ${theme.dim('Included Sections:')}`);
  for (const sec of sections) {
    console.log(`    ${theme.accent('✓')} ${sec}`);
  }
  console.log();
}
