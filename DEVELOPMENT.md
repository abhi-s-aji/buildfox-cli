# BuildFox Development Guide

This document describes the development workflow for BuildFox.

BuildFox is a TypeScript CLI application designed to analyze local projects and generate factual `README.md` files. Development should preserve its offline runtime, deterministic behavior, privacy boundaries, evidence-based analysis, and separation between scanning, analysis, documentation planning, rendering, and writing.

For contribution rules, see **[CONTRIBUTING.md](CONTRIBUTING.md)**.

For the internal architecture and data flow, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

For security requirements, see **[SECURITY.md](SECURITY.md)**.

---

## Table of Contents

* [Development Principles](#development-principles)
* [Project Structure](#project-structure)
* [Development Scripts](#development-scripts)
* [Running BuildFox During Development](#running-buildfox-during-development)
* [Testing](#testing)
* [Test Organization](#test-organization)
* [Working with Fixtures](#working-with-fixtures)
* [Type Checking](#type-checking)
* [Linting](#linting)
* [Building](#building)
* [Local CLI Verification](#local-cli-verification)
* [CI Validation](#ci-validation)
* [Testing Different Change Types](#testing-different-change-types)
* [Development Workflow](#development-workflow)
* [Package Verification](#package-verification)
* [Cross-Platform Development](#cross-platform-development)
* [Development Safety Rules](#development-safety-rules)
* [Architecture Boundaries](#architecture-boundaries)
* [Common Development Mistakes](#common-development-mistakes)
* [Development Checklist](#development-checklist)
* [Related Documentation](#related-documentation)

---

## Development Principles

BuildFox development follows several core principles.

### Offline Runtime

BuildFox must remain usable without network access at runtime.

Do not introduce runtime dependencies on:

* Cloud services
* AI/LLM services
* Remote APIs
* Telemetry services
* Network-based project analysis

---

### Static Analysis

BuildFox analyzes projects statically.

The analyzed project's code must not be executed as part of normal project analysis.

Analysis should work from filesystem contents and supported static evidence.

---

### Deterministic Behavior

The same project state should produce consistent analysis and documentation.

Avoid unnecessary sources of non-determinism.

---

### Evidence-Based Output

Generated documentation must reflect evidence found in the analyzed project.

Do not modify analysis merely to make generated documentation appear more complete.

If a feature, technology, API, model, command, or architectural relationship cannot be supported by available evidence, the generated documentation should not invent it.

---

### Separation of Responsibilities

BuildFox separates:

```text
Scanning
   ↓
Classification
   ↓
Detection & Analysis
   ↓
Documentation Planning
   ↓
Markdown Rendering
   ↓
File Writing
```

Changes should remain within the appropriate subsystem.

For detailed architecture information, see:

**[ARCHITECTURE.md](ARCHITECTURE.md)**

---

## Project Structure

The main project areas are:

```text
src/
├── cli.ts
├── index.ts
├── types.ts
├── scanner/
├── detect/
├── analyze/
├── generate/
├── ui/
└── write/

rules/
tests/
scripts/
.github/
package.json
tsconfig.json
LICENSE
SECURITY.md
CONTRIBUTING.md
```

### `src/`

Contains the core TypeScript implementation.

### `src/cli.ts`

CLI entry point and command-line argument handling.

### `src/index.ts`

Public exports.

### `src/types.ts`

Global interfaces and important data boundaries.

### `src/scanner/`

Filesystem scanning and classification.

### `src/detect/`

Technology detection and JSON rule processing.

### `src/analyze/`

Source analysis, API/model/command extraction, dependency analysis, and architecture-related inference.

### `src/generate/`

Documentation planning and Markdown generation.

### `src/ui/`

CLI interaction such as permission prompts and the user-facing terminal interface.

### `src/write/`

Safe README writing and atomic file operations.

### `rules/`

JSON-based technology detection rules.

### `tests/`

Vitest test suite.

### `scripts/`

Project development/build scripts.

### `.github/`

Repository automation and GitHub contribution configuration, including CI and contribution templates.

---

## Development Scripts

The project provides the following npm scripts.

### Development mode

```bash
npm run dev
```

Uses `tsx` for development execution.

Arguments can be passed to the development CLI as appropriate.

---

### Tests

```bash
npm test
```

Runs the Vitest test suite once.

---

### Test watch mode

```bash
npm run test:watch
```

Runs Vitest in watch mode for iterative development.

---

### Type checking

```bash
npm run typecheck
```

Runs TypeScript with:

```text
tsc --noEmit
```

This checks the TypeScript source without producing build output.

---

### Lint

```bash
npm run lint
```

The current project configuration uses the typecheck command for this script.

There is currently no separate ESLint or Prettier configuration described by the project.

---

### Build

```bash
npm run build
```

Builds the TypeScript project and runs the project's post-build processing.

The build uses TypeScript and:

```text
scripts/postbuild.js
```

---

## Running BuildFox During Development

The development CLI can be executed through the development script.

For example:

```bash
npm run dev -- <test-folder>
```

This allows a contributor to run BuildFox against a local test project without requiring the published npm package.

Use a dedicated test project or fixture when validating behavior that could otherwise modify a real project README.

---

## Testing

BuildFox uses **Vitest**.

The test suite covers the major components of the application.

A normal development cycle should include:

```bash
npm run typecheck
npm test
```

For changes that affect the built application, also run:

```bash
npm run build
```

For changes affecting CLI behavior, perform local CLI verification as described below.

---

## Test Organization

The test suite is organized according to the major BuildFox subsystems.

### Scanner

```text
tests/secret.test.ts
```

Covers scanner secret filtering behavior.

---

### Detection

```text
tests/detect.test.ts
tests/detect.matrix.test.ts
tests/detect.negative.test.ts
```

These tests cover technology detection, detection combinations, and negative detection behavior.

---

### Source Analysis

```text
tests/analyze.test.ts
```

Covers source analysis behavior.

---

### Dependency Analysis

```text
tests/dependency.test.ts
```

Covers dependency graph extraction.

---

### Architecture

```text
tests/architecture.test.ts
```

Covers architecture inference behavior.

---

### Documentation Planner

```text
tests/planner.test.ts
```

Covers documentation planning and template behavior.

---

### Markdown Generation

```text
tests/generator.test.ts
```

Covers Markdown generation.

---

### File Writer

```text
tests/writer.test.ts
```

Covers README writing behavior.

---

## Working with Fixtures

BuildFox uses generated fixture projects for detection testing.

The fixture-generation script is:

```text
tests/fixtures/create-fixtures.sh
```

When a test requires a fixture project:

1. Modify the fixture-generation script.
2. Generate the fixture projects.
3. Add or update the appropriate test.
4. Run the relevant test suite.
5. Verify the expected behavior.

Do not manually maintain generated fixture directories when the generation script is responsible for producing them.

This keeps the test fixtures reproducible.

---

## Adding a Detection Rule

Technology detection rules are stored as JSON files under:

```text
rules/
```

The rules are registered through:

```text
src/detect/resolve.ts
```

A new detection rule should be accompanied by appropriate fixture and test changes.

The general workflow is:

```text
Create/update JSON rule
        ↓
Register rule
        ↓
Update fixture generator
        ↓
Generate fixture
        ↓
Add detection assertion
        ↓
Run detection tests
```

For detailed detection architecture and rule design, see:

**[ARCHITECTURE.md](ARCHITECTURE.md)**

---

## Type Checking

Run:

```bash
npm run typecheck
```

before submitting changes.

BuildFox uses strict TypeScript configuration.

Type errors should not be ignored or bypassed merely to make the build pass.

When changing shared interfaces or types, review the consumers of the affected data.

In particular, changes to:

```text
src/types.ts
```

can affect multiple stages of the BuildFox pipeline.

---

## Linting

Run:

```bash
npm run lint
```

The current project configuration maps this command to the typecheck process.

There is no separate ESLint or Prettier configuration described in the current project.

Do not introduce a formatting or linting framework solely because it is commonly used elsewhere unless the project requirements are intentionally changed.

---

## Building

Run:

```bash
npm run build
```

The build performs the TypeScript compilation and the project's post-build processing.

A successful development change should not be considered complete until the build remains valid when the affected functionality is part of the compiled application.

---

## Local CLI Verification

Unit tests are not always sufficient for CLI behavior.

For CLI-related changes, perform an actual local CLI run against a controlled test project.

The development command can be used as:

```bash
npm run dev -- <test-folder>
```

Use this to verify behavior such as:

* CLI argument handling
* Analysis execution
* Template selection
* Dry-run behavior
* Analyze-only behavior
* Generated README output
* Permission flow
* File-writing behavior where appropriate

When testing write behavior, use a controlled project rather than an unrelated real project.

---

## CI Validation

The repository contains CI configuration under:

```text
.github/workflows/ci.yml
```

The current CI process validates the project across:

```text
Node.js 18
Node.js 20
Node.js 22
```

The CI workflow includes project validation such as:

```text
npm ci
lint
typecheck
test
build
package verification
```

A pull request should not rely solely on local testing.

The CI environment is an additional validation layer for the project.

---

## Testing Different Change Types

Different changes require different validation.

### Scanner changes

When changing scanner behavior:

* Test secret filtering.
* Verify ignored paths.
* Verify resource boundaries.
* Verify symlink behavior.
* Check that files outside the intended scope are not analyzed.

Relevant tests include:

```text
tests/secret.test.ts
```

---

### Detection changes

When changing detection:

* Update the appropriate JSON rule.
* Update fixture generation when necessary.
* Add or update detection tests.
* Check confidence behavior.
* Check for false positives.
* Check negative cases where relevant.

Relevant tests include:

```text
tests/detect.test.ts
tests/detect.matrix.test.ts
tests/detect.negative.test.ts
```

---

### Analyzer changes

When changing source analysis:

* Add or update analyzer tests.
* Verify that extracted information is supported by source evidence.
* Check that unsupported patterns remain omitted rather than fabricated.

Relevant tests include:

```text
tests/analyze.test.ts
```

---

### Dependency graph changes

When changing dependency extraction:

* Test import/require detection.
* Test relative path resolution.
* Verify dependency relationships.
* Check behavior against supported project structures.

Relevant tests:

```text
tests/dependency.test.ts
```

---

### Architecture changes

When changing architecture inference:

* Verify layer detection.
* Verify dependency relationships.
* Verify resulting architecture information.
* Check that generated documentation remains evidence-based.

Relevant tests:

```text
tests/architecture.test.ts
```

---

### Planner changes

When changing documentation planning:

* Test affected templates.
* Check conditional sections.
* Ensure empty sections are suppressed.
* Verify template depth behavior.

Relevant tests:

```text
tests/planner.test.ts
```

---

### Renderer changes

When changing Markdown generation:

* Test affected sections.
* Verify Markdown formatting.
* Check tables and code blocks.
* Ensure unsupported content is not rendered.
* Ensure empty sections are not produced.

Relevant tests:

```text
tests/generator.test.ts
```

---

### Writer changes

When changing file writing:

* Test write permissions.
* Test dry-run behavior.
* Test backup behavior.
* Test atomic writing.
* Verify failure behavior.
* Verify that unintended files are not modified.

Relevant tests:

```text
tests/writer.test.ts
```

Writer changes should receive particular attention because incorrect behavior can result in data loss or corrupted output.

---

## Development Workflow

A typical development workflow is:

```text
Understand the change
        ↓
Identify affected subsystem
        ↓
Read relevant architecture documentation
        ↓
Modify implementation
        ↓
Update fixtures if necessary
        ↓
Add/update tests
        ↓
Run typecheck
        ↓
Run tests
        ↓
Run local CLI verification when applicable
        ↓
Run build
        ↓
Review the final change
```

For contribution-specific requirements, see:

**[CONTRIBUTING.md](CONTRIBUTING.md)**

---

## Package Verification

BuildFox is distributed as an npm package.

The package configuration specifies the runtime files that are included in the published package.

The runtime package includes the compiled application and required rule/runtime assets.

When source structure or runtime assets change, verify that the package configuration still includes everything required by the installed CLI.

A source file existing in the repository does not automatically mean it is included in the published package.

Package-related changes should therefore be followed by build and package verification.

---

## Cross-Platform Development

BuildFox is intended to support:

* Linux
* macOS
* Windows

Path handling should remain platform-aware.

The project uses normalized path handling where appropriate, including conversion based on the platform path separator.

Do not introduce Linux-specific assumptions into filesystem logic unless the behavior is explicitly intended.

The current CI validation described by the project is Linux-based. Therefore, passing CI should not be interpreted as complete validation of Windows-specific behavior.

---

## Development Safety Rules

The following rules apply during development.

### Do not execute analyzed project code

BuildFox is a static analysis tool.

Do not make the analyzer execute the target project's code.

---

### Do not add runtime network access

BuildFox must remain offline at runtime.

Do not add network clients or external service calls to the analysis pipeline.

---

### Do not add telemetry

BuildFox does not require telemetry for its core operation.

Do not introduce telemetry or background reporting.

---

### Do not weaken secret filtering

Do not bypass scanner filters to make additional files available merely because they are useful for a particular analysis case.

Sensitive-file handling is part of the project's safety model.

---

### Do not re-enable unrestricted symlink traversal

Symlinks are intentionally skipped by the scanner.

Do not remove this restriction without a deliberate architectural and security review.

---

### Do not remove resource limits casually

The scanner has bounded traversal behavior.

Do not remove or substantially weaken:

* Maximum depth
* Maximum file count
* File-size restrictions
* Ignored directory handling

These constraints help prevent uncontrolled analysis.

---

### Do not bypass permission controls

BuildFox uses explicit permission controls for reading and writing.

Development changes must preserve those controls.

---

## Architecture Boundaries

The following boundaries should be preserved.

### Scanner

The scanner discovers files and produces the scanning result.

It should not become responsible for Markdown formatting.

---

### Detection and Analysis

Analysis interprets project evidence.

It should not directly format final Markdown output.

---

### Documentation Planner

The planner decides what documentation sections should exist and at what depth.

It should not become a second source-analysis system.

---

### Markdown Renderer

The renderer converts analyzed/planned information into Markdown.

It should not perform filesystem discovery.

---

### Writer

The writer is responsible for safe filesystem output.

It should not become responsible for understanding project architecture or detecting technologies.

---

For the full architecture model, see:

**[ARCHITECTURE.md](ARCHITECTURE.md)**

---

## Common Development Mistakes

### Adding unsupported claims

Do not add hardcoded descriptions of technologies, features, APIs, or architecture simply because they are common for a particular framework.

BuildFox should generate documentation from evidence.

---

### Solving a template problem in the analyzer

If one template needs different presentation or depth, prefer changing the documentation planner or renderer.

Do not modify project analysis simply to make one template longer.

---

### Manually maintaining generated fixtures

Use:

```text
tests/fixtures/create-fixtures.sh
```

when fixture projects are generated by the project.

---

### Testing only compilation

A successful TypeScript build does not prove that runtime behavior is correct.

Use the relevant tests and local CLI verification.

---

### Testing only one subsystem

A change can pass unit tests while affecting another part of the pipeline.

For changes crossing subsystem boundaries, test the complete affected flow where appropriate.

---

### Ignoring package contents

A build can succeed while the published package is missing a required runtime asset.

When package/runtime structure changes, perform package verification.

---

## Development Checklist

Before considering a development change complete:

### Code

* [ ] The change is limited to the appropriate subsystem.
* [ ] Existing architecture boundaries are preserved.
* [ ] TypeScript types remain correct.
* [ ] Unnecessary dependencies were not introduced.
* [ ] No runtime network access was introduced.
* [ ] No analyzed project code is executed.

### Security

* [ ] Secret filtering remains intact.
* [ ] Symlink restrictions remain intact.
* [ ] Scanner resource limits remain intact.
* [ ] Permission checks remain intact.
* [ ] Safe file writing remains intact.

### Tests

* [ ] Relevant tests were updated.
* [ ] Fixture generation was updated when necessary.
* [ ] `npm run typecheck` passes.
* [ ] `npm test` passes.
* [ ] Local CLI verification was performed when applicable.
* [ ] `npm run build` passes when applicable.

### Documentation

* [ ] Generated documentation remains evidence-based.
* [ ] No unsupported functionality is documented.
* [ ] No empty sections are introduced.
* [ ] Template-specific changes do not modify the underlying truth model unnecessarily.

### Packaging

* [ ] Runtime assets remain available after build.
* [ ] Package configuration still includes required runtime files when applicable.
* [ ] Package verification has been performed for package-related changes.

---

## Related Documentation

* **[README.md](README.md)** — User-facing project overview, installation, usage, and features.
* **[CONTRIBUTING.md](CONTRIBUTING.md)** — Contribution process, contribution principles, testing expectations, and pull request requirements.
* **[ARCHITECTURE.md](ARCHITECTURE.md)** — Detailed internal architecture, pipeline, data model, scanner, detection, analysis, generation, and writing.
* **[SECURITY.md](SECURITY.md)** — Security policy and vulnerability reporting.

---

## Development Reference

The most commonly used development commands are:

```bash
npm run dev
npm test
npm run test:watch
npm run typecheck
npm run lint
npm run build
```

For the architecture behind these commands and the systems they operate on, see:

**[ARCHITECTURE.md](ARCHITECTURE.md)**

For contribution requirements, see:

**[CONTRIBUTING.md](CONTRIBUTING.md)**
