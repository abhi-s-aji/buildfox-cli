import { ProjectAnalysis, TemplateType } from '../types';
import { renderTemplate } from './templates';
import { createDocumentationPlan } from './planner';

export interface RenderResult {
  content: string;
  lineCount: number;
  sections: string[];
}

export function generateReadmeContent(
  template: TemplateType,
  analysis: ProjectAnalysis
): RenderResult {
  const plan = createDocumentationPlan(analysis, template);
  const content = renderTemplate(plan, analysis);
  const lines = content.split('\n');
  const lineCount = lines.length;

  const sections = plan.sections.map(s => s.title);

  return {
    content,
    lineCount,
    sections,
  };
}
