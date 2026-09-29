import { describe, it, expect } from 'vitest';
import { scanProject } from '../src/scanner/walk';
import { detectTechnologies } from '../src/detect/engine';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { TechRule } from '../src/types';

// Load all rules
const rulesDir = path.join(__dirname, '../rules');
const rules: TechRule[] = fs.readdirSync(rulesDir)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(rulesDir, f), 'utf8')));

describe('Technology Detection Matrix', () => {
  const cases = [
    { fixture: 'detect-js', expected: ['JavaScript'] },
    { fixture: 'detect-ts', expected: ['TypeScript'] },
    { fixture: 'detect-react', expected: ['React', 'TypeScript'] },
    { fixture: 'detect-next', expected: ['Next.js', 'React', 'TypeScript'] },
    { fixture: 'detect-vue', expected: ['Vue.js'] },
    { fixture: 'detect-angular', expected: ['Angular'] },
    { fixture: 'detect-express', expected: ['Express', 'Node.js'] },
    { fixture: 'detect-python', expected: ['Python'] },
    { fixture: 'detect-django', expected: ['Django', 'Python'] },
    { fixture: 'detect-flask', expected: ['Flask', 'Python'] },
    { fixture: 'detect-fastapi', expected: ['FastAPI', 'Python'] },
    { fixture: 'detect-go', expected: ['Go'] },
    { fixture: 'detect-java', expected: ['Java'] },
    { fixture: 'detect-springboot', expected: ['Spring Boot', 'Java'] },
    { fixture: 'detect-kotlin', expected: ['Kotlin'] },
    { fixture: 'detect-android', expected: ['Android', 'Kotlin'] },
    { fixture: 'detect-dart', expected: ['Dart'] },
    { fixture: 'detect-flutter', expected: ['Flutter', 'Dart'] }
  ];

  for (const c of cases) {
    it(`correctly detects ${c.expected.join(', ')} in ${c.fixture}`, () => {
      const scan = scanProject(path.join(__dirname, 'fixtures', c.fixture));
      const detected = detectTechnologies(scan, rules)
        .filter(t => t.status === 'detected')
        .map(t => t.name);
      
      for (const expected of c.expected) {
        expect(detected).toContain(expected);
      }
      
      // Ensure no unrelated framework false positives (e.g. Django in Flask project)
      const frameworks = ['React', 'Next.js', 'Vue.js', 'Angular', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Android', 'Flutter'];
      for (const framework of frameworks) {
        if (!c.expected.includes(framework)) {
          expect(detected).not.toContain(framework);
        }
      }
    });
  }
});
