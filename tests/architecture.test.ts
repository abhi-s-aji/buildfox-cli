import { describe, it, expect } from 'vitest';
import { scanProject } from '../src/scanner/walk';
import { buildDependencyGraph, inferArchitecture } from '../src/analyze/dependency-extractor';
import * as path from 'node:path';

describe('Architecture Inference on Real Fixtures', () => {
  it('extracts express architecture', () => {
    const fixturePath = path.join(__dirname, 'fixtures/arch-express');
    const scan = scanProject(fixturePath);
    const graph = buildDependencyGraph(scan);
    const layers = inferArchitecture(scan, graph);

    const routes = layers.find(l => l.id === 'routing');
    const controllers = layers.find(l => l.id === 'controller');
    const services = layers.find(l => l.id === 'service');
    const models = layers.find(l => l.id === 'data');

    expect(routes).toBeDefined();
    expect(controllers).toBeDefined();
    expect(services).toBeDefined();
    expect(models).toBeDefined();

    expect(routes!.dependsOn).toContain('controller');
    expect(controllers!.dependsOn).toContain('service');
    expect(services!.dependsOn).toContain('data');
  });

  it('extracts python architecture', () => {
    const fixturePath = path.join(__dirname, 'fixtures/arch-python');
    const scan = scanProject(fixturePath);
    const graph = buildDependencyGraph(scan);
    const layers = inferArchitecture(scan, graph);

    const routes = layers.find(l => l.id === 'routing');
    const services = layers.find(l => l.id === 'service');
    const models = layers.find(l => l.id === 'data');

    expect(routes).toBeDefined();
    expect(routes!.dependsOn).toContain('service');
    expect(services!.dependsOn).toContain('data');
  });

  it('extracts go architecture', () => {
    const fixturePath = path.join(__dirname, 'fixtures/arch-go');
    const scan = scanProject(fixturePath);
    const graph = buildDependencyGraph(scan);
    const layers = inferArchitecture(scan, graph);

    // Go handlers mapped to controller perhaps? Let's check keywords. 
    // "handler" is in Controller layer.
    const controllers = layers.find(l => l.id === 'controller');
    const services = layers.find(l => l.id === 'service');
    const repos = layers.find(l => l.id === 'repository');

    expect(controllers).toBeDefined();
    expect(controllers!.dependsOn).toContain('service');
    expect(services!.dependsOn).toContain('repository');
  });

  it('extracts flutter architecture', () => {
    const fixturePath = path.join(__dirname, 'fixtures/arch-flutter');
    const scan = scanProject(fixturePath);
    const graph = buildDependencyGraph(scan);
    const layers = inferArchitecture(scan, graph);

    const screens = layers.find(l => l.id === 'presentation');
    const services = layers.find(l => l.id === 'service');
    const models = layers.find(l => l.id === 'data');

    expect(screens).toBeDefined();
    expect(screens!.dependsOn).toContain('service');
    expect(services!.dependsOn).toContain('data');
  });

  it('extracts android architecture', () => {
    const fixturePath = path.join(__dirname, 'fixtures/arch-android');
    const scan = scanProject(fixturePath, { maxDepth: 10 });
    const graph = buildDependencyGraph(scan);
    const layers = inferArchitecture(scan, graph);

    const ui = layers.find(l => l.id === 'presentation');
    // Note: viewmodel might map to presentation or missing in layerDefs, but repository and data are there
    const repos = layers.find(l => l.id === 'repository');
    const data = layers.find(l => l.id === 'data');

    expect(ui).toBeDefined();
    expect(repos).toBeDefined();
    expect(data).toBeDefined();
    // ui -> repos, repos -> data
  });
});
