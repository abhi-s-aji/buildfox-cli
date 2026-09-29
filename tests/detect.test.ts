import { describe, it, expect, afterEach } from 'vitest';
import { createFixture, cleanupFixture } from './fixtures/fixture-setup';
import { scanProject } from '../src/scanner/walk';
import { detectTechnologies } from '../src/detect/engine';
import { loadAllRules } from '../src/detect/resolve';
import { detectCrossCutting } from '../src/detect/cross-cutting';

describe('Technology Detection Engine', () => {
  const rules = loadAllRules();

  afterEach(() => {
    cleanupFixture('test-node');
    cleanupFixture('test-react');
    cleanupFixture('test-next');
    cleanupFixture('test-express');
    cleanupFixture('test-python');
    cleanupFixture('test-django');
    cleanupFixture('test-fastapi');
    cleanupFixture('test-flutter');
    cleanupFixture('test-android');
    cleanupFixture('test-go');
  });

  it('detects Node.js & Express in Express project', () => {
    const dir = createFixture('test-express', {
      'package.json': JSON.stringify({
        name: 'express-app',
        scripts: { start: 'node app.js' },
        dependencies: { express: '^4.18.2' },
      }),
      'app.js': `const express = require('express'); const app = express(); app.get('/api/health', (req, res) => res.send('OK'));`,
    });

    const scan = scanProject(dir);
    const tech = detectTechnologies(scan, rules);
    const techIds = tech.map((t) => t.id);

    expect(techIds).toContain('node');
    expect(techIds).toContain('express');
  });

  it('detects React & TypeScript', () => {
    const dir = createFixture('test-react', {
      'package.json': JSON.stringify({
        name: 'react-app',
        dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
        devDependencies: { typescript: '^5.0.0' },
      }),
      'tsconfig.json': '{}',
      'src/App.tsx': `export const App = () => <h1>Hello</h1>;`,
    });

    const scan = scanProject(dir);
    const tech = detectTechnologies(scan, rules);
    const cross = detectCrossCutting(scan);

    expect(tech.map((t) => t.id)).toContain('react');
    expect(cross.isTypeScript).toBe(true);
  });

  it('detects Django project without false positives', () => {
    const dir = createFixture('test-django', {
      'manage.py': `import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproj.settings')`,
      'requirements.txt': 'Django>=4.2\npsycopg2>=2.9',
      'myproj/urls.py': `from django.urls import path\nurlpatterns = [path('api/v1/posts/', views.PostList.as_view())]`,
      'myproj/models.py': `from django.db import models\nclass Post(models.Model):\n  title = models.CharField(max_length=100)`,
    });

    const scan = scanProject(dir);
    const tech = detectTechnologies(scan, rules);

    expect(tech.map((t) => t.id)).toContain('django');
    expect(tech.map((t) => t.id)).toContain('python');
  });

  it('detects Flutter without false-positive Android native tag', () => {
    const dir = createFixture('test-flutter', {
      'pubspec.yaml': `name: my_flutter_app\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'\ndependencies:\n  flutter:\n    sdk: flutter`,
      'lib/main.dart': `void main() => runApp(MyApp());`,
      'android/app/src/main/AndroidManifest.xml': `<manifest></manifest>`,
    });

    const scan = scanProject(dir);
    const tech = detectTechnologies(scan, rules);
    const techIds = tech.map((t) => t.id);

    expect(techIds).toContain('flutter');
    expect(techIds).not.toContain('android');
  });

  it('detects Go project correctly', () => {
    const dir = createFixture('test-go', {
      'go.mod': `module example.com/mygoapp\n\ngo 1.20`,
      'main.go': `package main\n\nimport "net/http"\n\nfunc main() {\n  http.HandleFunc("/api/ping", pingHandler)\n}`,
    });

    const scan = scanProject(dir);
    const tech = detectTechnologies(scan, rules);

    expect(tech.map((t) => t.id)).toContain('go');
  });
});
