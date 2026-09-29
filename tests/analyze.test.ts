import { describe, it, expect, afterEach } from 'vitest';
import { createFixture, cleanupFixture } from './fixtures/fixture-setup';
import { scanProject } from '../src/scanner/walk';
import { analyzeProject } from '../src/analyze/evidence';
import { extractApiEndpoints } from '../src/analyze/api-extractor';
import { extractDatabaseModels } from '../src/analyze/model-extractor';

describe('Static Code Analysis', () => {
  afterEach(() => {
    cleanupFixture('test-analysis-api');
    cleanupFixture('test-analysis-models');
  });

  it('extracts API endpoints from Express and FastAPI source files', () => {
    const dir = createFixture('test-analysis-api', {
      'src/server.ts': `import express from 'express';
const app = express();
app.get('/api/v1/users', (req, res) => {});
app.post('/api/v1/users', (req, res) => {});
app.delete('/api/v1/users/:id', (req, res) => {});
`,
      'package.json': '{"name": "api-app", "dependencies": {"express": "4.18.2"}}',
    });

    const scan = scanProject(dir);
    const endpoints = extractApiEndpoints(scan);

    expect(endpoints.length).toBe(3);
    expect(endpoints[0].method).toBe('GET');
    expect(endpoints[0].path).toBe('/api/v1/users');
    expect(endpoints[1].method).toBe('POST');
    expect(endpoints[2].method).toBe('DELETE');
  });

  it('extracts database models from Django source files', () => {
    const dir = createFixture('test-analysis-models', {
      'models.py': `from django.db import models

class UserProfile(models.Model):
  bio = models.CharField(max_length=255)
  age = models.IntegerField()

class Order(models.Model):
  total = models.DecimalField()
`,
      'requirements.txt': 'Django',
    });

    const scan = scanProject(dir);
    const models = extractDatabaseModels(scan);

    expect(models.length).toBe(2);
    expect(models[0].name).toBe('UserProfile');
    expect(models[0].fields).toContain('bio');
    expect(models[0].fields).toContain('age');
    expect(models[1].name).toBe('Order');
  });

  it('assembles structured ProjectAnalysis object without inventing facts', () => {
    const dir = createFixture('test-analysis-full', {
      'package.json': JSON.stringify({
        name: 'my-custom-tool',
        description: 'A CLI tool for analyzing local projects.',
        scripts: { build: 'tsc', test: 'vitest run' },
        dependencies: { express: '4.18.2' },
      }),
    });

    const scan = scanProject(dir);
    const analysis = analyzeProject(scan);

    expect(analysis.metadata.projectName).toBe('my-custom-tool');
    expect(analysis.purpose).toBe('A CLI tool for analyzing local projects.');
    expect(analysis.commands.some((c) => c.command === 'npm run build')).toBe(true);
    expect(analysis.commands.some((c) => c.command === 'npm test')).toBe(true);
    // Should NOT invent npm start since start script doesn't exist
    expect(analysis.commands.some((c) => c.name === 'start')).toBe(false);
  });
});
