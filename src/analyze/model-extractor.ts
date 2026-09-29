import { DatabaseModel, ScanResult } from '../types';
import { readTextFileSafe } from '../scanner/reader';

export function extractDatabaseModels(scan: ScanResult): DatabaseModel[] {
  const models: DatabaseModel[] = [];
  const MAX_MODELS = 5;

  const validFiles = scan.files.filter(f => f.scope === 'application' || f.scope === 'tooling');
  for (const file of validFiles) {
    if (file.isDirectory || file.size > 500 * 1024) continue;
    if (!/\.(py|kt|java|ts)$/i.test(file.path)) continue;

    const res = readTextFileSafe(file.absolutePath, file.path);
    if (!res.content) continue;

    const lines = res.content.split(/\r?\n/);

    for (let idx = 0; idx < lines.length; idx++) {
      if (models.length >= MAX_MODELS) break;
      const line = lines[idx].trim();

      // Django / SQLAlchemy model class
      const pyModelMatch = line.match(/^class\s+([A-Z][A-Za-z0-9_]*)\s*\(\s*(?:models\.Model|db\.Model|Base|SQLModel)\s*(?:,.*)?\):/);
      if (pyModelMatch) {
        const modelName = pyModelMatch[1];
        const fields: string[] = [];

        // Scan subsequent lines for fields
        for (let j = idx + 1; j < Math.min(lines.length, idx + 20); j++) {
          const fieldLine = lines[j].trim();
          if (fieldLine.startsWith('class ')) break;
          const fieldMatch = fieldLine.match(/^([a-z_][a-z0-9_]*)\s*=\s*(?:models\.|db\.|Column|Field)/i);
          if (fieldMatch) {
            fields.push(fieldMatch[1]);
          }
        }

        models.push({
          name: modelName,
          file: file.path,
          fields: fields.length > 0 ? fields : undefined,
          framework: line.includes('models.Model') ? 'Django ORM' : 'SQLAlchemy',
        });
        continue;
      }

      // Android Room @Entity
      if (line.includes('@Entity')) {
        let modelName: string | undefined;
        for (let j = idx + 1; j < Math.min(lines.length, idx + 5); j++) {
          const nextLine = lines[j].trim();
          const classMatch = nextLine.match(/(?:data\s+)?class\s+([A-Z][A-Za-z0-9_]*)/);
          if (classMatch) {
            modelName = classMatch[1];
            break;
          }
        }
        if (modelName) {
          models.push({
            name: modelName,
            file: file.path,
            framework: 'Android Room',
          });
        }
        continue;
      }
    }
  }

  return models;
}
