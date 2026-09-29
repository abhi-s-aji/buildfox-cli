# Contributing to BuildFox

Thank you for your interest in contributing to BuildFox.

BuildFox is an offline, privacy-first static analysis tool that analyzes a local project and generates a factual `README.md`. Contributions should preserve its core principles: accurate analysis, deterministic behavior, privacy, safety, maintainability, and clear separation between analysis and documentation generation.

This document explains **how to contribute safely and consistently**. Detailed technical documentation is separated into dedicated documents so that this file remains focused on the contribution process.

---

## Table of Contents

* [Before Contributing](#before-contributing)
* [Core Contribution Principles](#core-contribution-principles)
* [Understanding the Project](#understanding-the-project)
* [Development](#development)
* [Architecture](#architecture)
* [Choosing Where to Make a Change](#choosing-where-to-make-a-change)
* [Testing Requirements](#testing-requirements)
* [Working with Fixtures](#working-with-fixtures)
* [Adding or Updating Technology Detection](#adding-or-updating-technology-detection)
* [Security and Privacy Requirements](#security-and-privacy-requirements)
* [Code Quality Expectations](#code-quality-expectations)
* [Common Contribution Workflow](#common-contribution-workflow)
* [High-Risk Areas](#high-risk-areas)
* [Pull Request Expectations](#pull-request-expectations)
* [Current Project Limitations](#current-project-limitations)
* [Contributor Checklist](#contributor-checklist)

---

## Before Contributing

Before making a change, first understand what part of BuildFox your change affects.

BuildFox is organized as a pipeline:

```text
CLI
  ↓
Scanner
  ↓
Detection & Analysis
  ↓
Documentation Planner
  ↓
Markdown Renderer
  ↓
Safe Writer
```

The main implementation areas are:

```text
src/cli.ts
src/scanner/
src/detect/
src/analyze/
src/generate/
src/ui/
src/write/
rules/
tests/
scripts/
```

Do not make changes across these boundaries without understanding how the affected data flows through the system.

For the detailed internal architecture, see:

**[Architecture Guide](ARCHITECTURE.md)**

For development commands, local testing, build instructions, and development workflow, see:

**[Development Guide](DEVELOPMENT.md)**

---

## Core Contribution Principles

### 1. Preserve factual output

BuildFox generates documentation from evidence found in the analyzed project.

Do not add functionality that causes BuildFox to claim something exists when the source evidence does not support it.

If functionality cannot be reliably observed or inferred from the available evidence, it should generally be omitted rather than invented.

The central principle is:

> **Truthfulness and evidence take priority over completeness.**

---

### 2. Preserve deterministic behavior

BuildFox is designed to produce deterministic analysis and documentation from the same project state.

Avoid introducing behavior that depends on:

* External services
* Randomness
* Uncontrolled environment state
* Network responses
* AI or LLM services
* Non-deterministic external processing

---

### 3. Preserve the offline runtime

BuildFox is intended to operate without network access at runtime.

Do not add network requests, telemetry, or cloud/AI dependencies to the runtime analysis pipeline.

---

### 4. Preserve privacy and safety boundaries

BuildFox analyzes local repositories that may contain sensitive information.

Changes must not weaken:

* Secret filtering
* File-size limits
* File-count limits
* Directory-depth limits
* Symlink restrictions
* Binary-file handling
* Permission prompts
* Safe writing behavior

Security-sensitive changes require particular care.

See:

**[Security Policy](SECURITY.md)**

---

### 5. Keep responsibilities separated

BuildFox has explicit boundaries between scanning, analysis, planning, rendering, and writing.

For example:

* Filesystem discovery belongs in the scanner.
* Technology detection belongs in the detection system.
* Project understanding belongs in analysis.
* Documentation structure belongs in the planner.
* Markdown formatting belongs in generation.
* Filesystem writes belong in the writer.

Do not move unrelated responsibilities into another layer simply because it is convenient.

---

## Understanding the Project

The main data flow is:

```text
parseCliArgs()
    ↓
confirmReadPermission()
    ↓
scanProject()
    ↓
analyzeProject()
    ↓
createDocumentationPlan()
    ↓
generateReadmeContent()
    ↓
confirmWritePermission()
    ↓
writeReadmeFile()
    ↓
atomicWriteFile()
```

The central analysis object is `ProjectAnalysis`.

It represents the information used by the documentation planner and renderer.

The important data boundaries include:

* `FileEntry`
* `ScanResult`
* `TechRule`
* `RuleSignal`
* `ProjectAnalysis`
* `DocumentationPlan`

BuildFox distinguishes between:

* **Observed data** — directly found in the project
* **Inferred data** — conclusions supported by available evidence
* **Derived data** — information calculated from other analysis results

Do not treat derived or inferred information as if it were directly observed.

For the complete technical explanation, see:

**[Architecture Guide](ARCHITECTURE.md)**

---

## Development

Development environment setup, available npm scripts, local CLI testing, build behavior, fixture generation, and CI-related development checks are documented separately.

See:

**[Development Guide](DEVELOPMENT.md)**

Do not duplicate detailed development instructions here unless they are specifically required as contribution rules.

---

## Architecture

BuildFox's internal architecture is documented separately to keep this contribution guide focused.

The architecture documentation covers:

* Execution pipeline
* Repository structure
* Core data model
* Scanner
* File classification
* Detection engine
* Detection rules
* Source analysis
* Dependency graph
* Architecture inference
* Application flow
* Documentation planner
* Templates
* Markdown rendering
* Safe file writing
* Technical limitations

See:

**[Architecture Guide](ARCHITECTURE.md)**

---

## Choosing Where to Make a Change

Use the following map when deciding where a change belongs.

| Change                        | Primary location                      |
| ----------------------------- | ------------------------------------- |
| CLI arguments or CLI behavior | `src/cli.ts`                          |
| File traversal                | `src/scanner/`                        |
| Secret filtering              | `src/scanner/filters.ts`              |
| File classification           | `src/scanner/classifier.ts`           |
| Technology detection logic    | `src/detect/`                         |
| Technology detection rules    | `rules/`                              |
| Purpose or feature inference  | `src/analyze/`                        |
| API extraction                | `src/analyze/api-extractor.ts`        |
| Model extraction              | `src/analyze/model-extractor.ts`      |
| Command detection             | `src/analyze/command-detector.ts`     |
| Dependency analysis           | `src/analyze/dependency-extractor.ts` |
| Documentation structure       | `src/generate/planner.ts`             |
| Markdown rendering            | `src/generate/content.ts`             |
| File writing                  | `src/write/`                          |
| Tests                         | `tests/`                              |
| Generated test projects       | `tests/fixtures/create-fixtures.sh`   |
| Detection rules               | `rules/`                              |
| CI                            | `.github/workflows/`                  |

When a change affects more than one area, understand the data flow between those areas before modifying the implementation.

---

## Testing Requirements

BuildFox uses **Vitest** for testing.

Behavioral changes should include appropriate tests.

Use the test area that corresponds to the part of the system being changed.

| Change                      | Relevant tests                  |
| --------------------------- | ------------------------------- |
| Scanner filters             | `tests/secret.test.ts`          |
| Technology detection        | `tests/detect.test.ts`          |
| Detection matrix behavior   | `tests/detect.matrix.test.ts`   |
| Negative detection behavior | `tests/detect.negative.test.ts` |
| Source analyzers            | `tests/analyze.test.ts`         |
| Dependency graph            | `tests/dependency.test.ts`      |
| Architecture inference      | `tests/architecture.test.ts`    |
| Documentation planning      | `tests/planner.test.ts`         |
| Markdown generation         | `tests/generator.test.ts`       |
| File writing                | `tests/writer.test.ts`          |

At minimum, contributors should run the relevant tests for their change.

Before opening a pull request, run the project's required validation checks described in the [Development Guide](DEVELOPMENT.md).

---

## Working with Fixtures

BuildFox uses generated fixture projects for detection testing.

Fixture projects are generated through:

```text
tests/fixtures/create-fixtures.sh
```

When a detection change requires a new fixture:

1. Update the fixture-generation script.
2. Generate the fixtures.
3. Add or update the corresponding test.
4. Run the relevant detection tests.
5. Verify the expected detection confidence and behavior.

Do not manually create fixture directories when the fixture-generation script is responsible for generating them.

This keeps fixtures reproducible.

---

## Adding or Updating Technology Detection

Technology detection is based on JSON rules.

Rules are registered through:

```text
src/detect/resolve.ts
```

Detection signals currently include:

* `fileExists`
* `dirExists`
* `filePattern`
* `fileContains`
* `dependency`
* `jsonPath`
* `negative`

Detection uses evidence and scope-aware scoring.

When adding a technology, prefer strong, specific evidence.

For example, a dependency that uniquely identifies a technology is stronger evidence than a generic file extension.

General rule guidance:

* Strong package dependencies may use higher weights.
* Weak generic file extensions should use lower weights.
* Negative signals can be used where necessary to reduce collisions.
* Avoid overly generic `fileContains` signals.

Detection rules must avoid creating false positives from:

* Fixtures
* Examples
* Documentation
* Tooling
* Generated files
* Vendor code

For the detailed detection architecture and rule design, see:

**[Architecture Guide](ARCHITECTURE.md)**

For a technology-detection change, update the appropriate tests and fixtures.

---

## Security and Privacy Requirements

BuildFox operates on local repositories and is intentionally designed with strict privacy and safety boundaries.

Contributors must not introduce:

### Network access

Do not add runtime network access to the analysis pipeline.

Do not introduce:

* Network requests
* Telemetry
* Cloud analysis
* AI/LLM services
* External project-analysis services

BuildFox must remain usable offline.

---

### Project code execution

BuildFox statically analyzes projects.

Do not execute analyzed project code.

Do not introduce mechanisms such as:

```text
eval()
child_process.exec()
```

for the purpose of analyzing a project.

Parsing and analysis should remain static.

---

### Secret exposure

Do not weaken or bypass secret filtering.

The scanner intentionally prevents sensitive files and content from being processed.

Changes involving scanner filtering require corresponding tests.

---

### Symlink handling

Do not re-enable unrestricted symlink following.

The scanner intentionally skips symlinks to avoid unsafe traversal behavior and potential loops.

---

### Resource limits

Do not casually remove or weaken scanner limits.

The scanner currently has bounded behavior including:

* Maximum depth
* Maximum file count
* File-size limits
* Binary-file skipping
* Ignored directories

These limits are part of the safety model.

---

### File writing

Changes to the writer must preserve safe writing behavior.

BuildFox uses a controlled writing process including:

* Explicit write permission
* Dry-run behavior
* Backup behavior
* Atomic writes

Changes to this area should be treated as high-risk.

For detailed security requirements, see:

**[Security Policy](SECURITY.md)**

---

## Code Quality Expectations

BuildFox is written in strict TypeScript.

Contributions should follow the existing implementation style:

* Use TypeScript types and interfaces.
* Prefer pure functions where practical.
* Keep data flow explicit.
* Minimize unnecessary side effects.
* Keep responsibilities separated.
* Prefer existing Node.js functionality where appropriate.
* Avoid unnecessary runtime dependencies.
* Preserve the existing CommonJS output and ES2022 target.
* Use Node-style imports such as `node:path` and `node:fs` where consistent with the existing code.
* Avoid introducing a large CLI framework when simple argument handling is sufficient.

Do not introduce abstractions merely for the sake of abstraction.

The goal is maintainable code with clear behavior and explicit boundaries.

---

## Common Contribution Workflow

A normal contribution should follow this general process.

### 1. Understand the change

Identify which part of BuildFox the change affects.

Use:

**[Architecture Guide](ARCHITECTURE.md)**

when the change requires understanding internal data flow or subsystem boundaries.

---

### 2. Modify the appropriate implementation

Make the smallest appropriate change in:

```text
src/
rules/
tests/
scripts/
.github/
```

depending on the change.

Do not modify unrelated components.

---

### 3. Update fixtures when necessary

If the change affects technology detection or fixture-based behavior, update:

```text
tests/fixtures/create-fixtures.sh
```

and regenerate the fixtures.

---

### 4. Add or update tests

Every behavior change should have appropriate test coverage.

Use the existing test organization rather than creating unrelated test structures.

---

### 5. Run validation

Run the relevant development checks.

The complete command reference is maintained in:

**[Development Guide](DEVELOPMENT.md)**

At minimum, changes should be checked with the appropriate typechecking and tests before submitting a pull request.

---

### 6. Verify actual behavior

For CLI behavior changes, verify the behavior using a test project where appropriate.

The development guide documents local CLI verification.

---

### 7. Review the change

Before opening a pull request, check that the change:

* Does what it is intended to do.
* Does not introduce unrelated behavior.
* Does not weaken security boundaries.
* Does not introduce network access.
* Does not execute analyzed project code.
* Does not create unsupported documentation claims.
* Has appropriate tests.
* Preserves existing architecture boundaries.

---

### 8. Open a pull request

Submit the change through the repository's pull-request workflow.

The repository contains GitHub pull-request and issue templates under:

```text
.github/
```

Follow the applicable template when opening a pull request.

---

## High-Risk Areas

Some parts of BuildFox require additional care because incorrect changes can affect safety, correctness, or generated documentation.

### Scanner

Potential risks include:

* Symlink loops
* Secret exposure
* Resource exhaustion
* Excessive filesystem traversal

---

### Detection Rules

Potential risks include:

* False positives
* False negatives
* Incorrect confidence scores
* Fixture/tooling files being mistaken for application evidence

---

### Source Analyzers

Potential risks include:

* Incorrect regular-expression matching
* Missing supported patterns
* Incorrect API/model/command extraction
* Documentation claims that are not supported by source evidence

---

### Dependency Graph

Potential risks include:

* Incorrect import resolution
* Modern ESM parsing gaps
* Regular-expression performance problems
* Catastrophic backtracking

Changes to dependency extraction should therefore be tested carefully.

---

### Documentation Planner and Renderer

Potential risks include:

* Missing sections
* Empty sections
* Incorrect template depth
* False documentation
* Broken Markdown
* Unsupported claims

Templates are presentation/depth layers over the same project analysis. Do not solve template-specific problems by changing the underlying analysis to produce artificial content.

---

### Writer and Atomic Writes

Potential risks include:

* Data loss
* Corrupted output
* Incorrect backup behavior
* Writes occurring without appropriate permission
* Dry-run accidentally modifying files

Changes here require careful testing.

---

### Package Contents

Changes to the source structure or runtime assets can affect the published npm package.

If runtime files or directories are added or moved, verify that the package configuration includes everything required at runtime.

---

## Pull Request Expectations

A pull request should make its intended change clear.

Contributors should ensure:

* The change is focused.
* Relevant tests are included or updated.
* Typechecking passes.
* Tests pass.
* Build behavior remains valid.
* Existing architecture boundaries are preserved.
* Privacy and security requirements remain intact.
* No unnecessary runtime dependency is introduced.
* No runtime network access is introduced.
* No analyzed project code is executed.
* Documentation output remains evidence-based.

CI must pass the repository's required checks.

The CI configuration currently tests the project across Node.js 18, 20, and 22 and runs the project's lint/typecheck/test/build/package-related validation.

---

## Current Project Limitations

Contributors should be aware of the current technical boundaries of BuildFox.

### Static parsing

BuildFox relies on static analysis and regular-expression-based extraction in several areas.

It cannot fully understand all dynamic behavior.

This includes limitations around:

* Dynamic routing
* Dependency injection
* Highly abstracted frameworks
* Complex runtime behavior
* Some modern language/framework constructs

Do not claim complete framework or source understanding where the implementation cannot provide it.

---

### Detection registry

Technology rules are currently registered through a hardcoded rule registry.

---

### Root-level analysis

BuildFox currently analyzes the project at the root level.

Generating separate README files for individual monorepo sub-packages is not currently supported.

---

### Platform validation

BuildFox is intended to support:

* Linux
* macOS
* Windows

However, the current CI validation described by the project is Linux-based. Do not treat Linux CI success as proof that every Windows-specific behavior has been validated.

---

### Evidence-bounded documentation

BuildFox intentionally prefers incomplete but factual documentation over complete-looking documentation containing unsupported claims.

This is a deliberate project behavior, not a defect to be removed merely to make generated READMEs longer.

---

## Contributor Checklist

Before submitting a pull request, verify the following.

### Understanding

* [ ] I understand which subsystem my change affects.
* [ ] I checked the [Architecture Guide](ARCHITECTURE.md) when necessary.
* [ ] I checked the [Development Guide](DEVELOPMENT.md) for the relevant development workflow.

### Implementation

* [ ] The change is placed in the appropriate project area.
* [ ] Existing architecture boundaries are preserved.
* [ ] I did not add unnecessary dependencies.
* [ ] I did not introduce runtime network access.
* [ ] I did not introduce analyzed-project code execution.

### Security

* [ ] Secret filtering remains intact.
* [ ] Symlink restrictions remain intact.
* [ ] Scanner limits remain intact.
* [ ] Permission checks remain intact.
* [ ] Safe/atomic writing behavior remains intact where applicable.

### Testing

* [ ] Relevant tests were added or updated.
* [ ] Fixtures were updated through `tests/fixtures/create-fixtures.sh` when necessary.
* [ ] Typechecking passes.
* [ ] Tests pass.
* [ ] Build validation passes where applicable.

### Documentation

* [ ] Generated documentation remains evidence-based.
* [ ] No unsupported functionality is documented.
* [ ] No empty documentation sections are introduced.
* [ ] Template-specific changes do not corrupt the underlying analysis model.

### Pull Request

* [ ] The pull request is focused.
* [ ] The change is clearly described.
* [ ] Relevant validation has been completed.
* [ ] Existing project contribution and security requirements are followed.

---

## Related Documentation

For more detailed information, use the appropriate document rather than expanding this file unnecessarily.

* **[Architecture Guide](ARCHITECTURE.md)** — Internal architecture, execution pipeline, data model, scanner, detection, analysis, dependency graph, documentation generation, and writer.
* **[Development Guide](DEVELOPMENT.md)** — Development workflow, commands, testing, building, fixtures, local verification, and CI-related development checks.
* **[Security Policy](SECURITY.md)** — Security requirements and vulnerability reporting.
* **[README](README.md)** — Project overview, installation, usage, and user-facing documentation.

---

## Final Principle

When contributing to BuildFox, prioritize:

```text
Correctness
    ↓
Safety
    ↓
Privacy
    ↓
Evidence
    ↓
Maintainability
    ↓
Completeness
```

BuildFox should never sacrifice factual output, privacy, or safety merely to produce more documentation or support more cases.

When in doubt about an implementation change, first understand the existing data flow and architecture before changing it.
