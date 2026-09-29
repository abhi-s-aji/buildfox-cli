import { describe, it, expect } from 'vitest';
import { scanProject } from '../src/scanner/walk';
import { detectTechnologies } from '../src/detect/engine';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { TechRule } from '../src/types';

const rulesDir = path.join(__dirname, '../rules');
const rules: TechRule[] = fs.readdirSync(rulesDir)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(rulesDir, f), 'utf8')));

describe('Technology False-Positive Protection', () => {
  const cases = [
    { fixture: 'detect-java', notExpected: ['Spring Boot'] },
    { fixture: 'detect-kotlin', notExpected: ['Android'] },
    { fixture: 'detect-dart', notExpected: ['Flutter'] },
    { fixture: 'detect-js', notExpected: ['React'] },
    { fixture: 'detect-ts', notExpected: ['React'] },
    { fixture: 'detect-python', notExpected: ['Django', 'Flask', 'FastAPI'] },
  ];

  for (const c of cases) {
    it(`does not detect ${c.notExpected.join(', ')} in ${c.fixture}`, () => {
      const scan = scanProject(path.join(__dirname, 'fixtures', c.fixture));
      const detected = detectTechnologies(scan, rules)
        .filter(t => t.status === 'detected')
        .map(t => t.name);
      
      for (const expected of c.notExpected) {
        expect(detected).not.toContain(expected);
      }
    });
  }
  
  it('does not detect frameworks purely from README text', () => {
    // We create a temporary directory for this test
    const tempDir = path.join(__dirname, 'fixtures', 'detect-readme-false');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.writeFileSync(path.join(tempDir, 'README.md'), 'This is a test project. We love React, Spring Boot, Android, Flutter, and Django!');
    
    const scan = scanProject(tempDir);
    const detected = detectTechnologies(scan, rules)
      .filter(t => t.status === 'detected')
      .map(t => t.name);
    
    expect(detected).not.toContain('React');
    expect(detected).not.toContain('Spring Boot');
    expect(detected).not.toContain('Android');
    expect(detected).not.toContain('Flutter');
    expect(detected).not.toContain('Django');
  });
});
