# BuildFox Architecture

This document describes the internal architecture of BuildFox.

BuildFox is an offline, privacy-first static analysis tool that analyzes a local project and generates a factual `README.md`.

The architecture is designed around a clear pipeline:

```text
CLI
  ↓
Scanner
  ↓
Classification
  ↓
Detection & Analysis
  ↓
ProjectAnalysis
  ↓
Documentation Planner
  ↓
Markdown Renderer
  ↓
Safe Writer
```

The system intentionally separates project analysis from documentation presentation and file writing.

For contribution workflow, see **[CONTRIBUTING.md](CONTRIBUTING.md)**.

For development commands, testing, building, and local verification, see **[DEVELOPMENT.md](DEVELOPMENT.md)**.

For security requirements and vulnerability reporting, see **[SECURITY.md](SECURITY.md)**.

---

## Table of Contents

* [Architecture Goals](#architecture-goals)
* [Core Design Principles](#core-design-principles)
* [System Overview](#system-overview)
* [Repository Structure](#repository-structure)
* [Execution Pipeline](#execution-pipeline)
* [CLI Layer](#cli-layer)
* [Permission Flow](#permission-flow)
* [Scanner](#scanner)
* [File Classification](#file-classification)
* [Detection Engine](#detection-engine)
* [Technology Detection Rules](#technology-detection-rules)
* [Adding a Technology](#adding-a-technology)
* [Source Analysis](#source-analysis)
* [Purpose and Feature Inference](#purpose-and-feature-inference)
* [API Extraction](#api-extraction)
* [Model Extraction](#model-extraction)
* [Command Detection](#command-detection)
* [Dependency Graph](#dependency-graph)
* [Architecture Inference](#architecture-inference)
* [Application Flow](#application-flow)
* [ProjectAnalysis](#projectanalysis)
* [Documentation Planning](#documentation-planning)
* [Documentation Templates](#documentation-templates)
* [Markdown Rendering](#markdown-rendering)
* [Safe File Writing](#safe-file-writing)
* [Data Flow and Boundaries](#data-flow-and-boundaries)
* [Truth Model](#truth-model)
* [Security Architecture](#security-architecture)
* [Performance and Resource Boundaries](#performance-and-resource-boundaries)
* [Testing Architecture](#testing-architecture)
* [Package Architecture](#package-architecture)
* [Cross-Platform Considerations](#cross-platform-considerations)
* [Known Architectural Limitations](#known-architectural-limitations)
* [Change Impact Map](#change-impact-map)
* [Architecture Principles for Contributors](#architecture-principles-for-contributors)

---

# Architecture Goals

BuildFox is designed around several architectural goals.

### Offline operation

BuildFox performs analysis locally.

The runtime analysis pipeline does not depend on:

* External APIs
* Cloud services
* AI/LLM services
* Telemetry
* Network-based analysis

---

### Evidence-based documentation

BuildFox should generate documentation from evidence discovered in the analyzed project.

The system should not invent:

* Technologies
* Features
* APIs
* Models
* Commands
* Architectural relationships
* Other project capabilities

when the available evidence does not support them.

---

### Separation of responsibilities

Each stage of the system has a defined responsibility.

```text
Scanner
    ↓
Find project files

Classifier
    ↓
Determine file scope

Detection / Analysis
    ↓
Understand project evidence

ProjectAnalysis
    ↓
Provide central analysis model

Planner
    ↓
Decide documentation structure

Renderer
    ↓
Convert analysis into Markdown

Writer
    ↓
Safely write README.md
```

This separation allows changes to one stage without unnecessarily coupling the rest of the system to its implementation details.

---

### Safe filesystem behavior

BuildFox analyzes local repositories that may contain sensitive files.

The scanner therefore uses bounded traversal and filtering, while the writer uses controlled and atomic output behavior.

---

# Core Design Principles

## 1. Analysis before presentation

The analyzer should produce project information independently of the final README template.

Templates are presentation and depth layers over the same project analysis.

A template should not require a different analysis implementation merely because it presents more or less information.

---

## 2. Evidence over assumptions

BuildFox should prefer:

```text
Supported evidence
      ↓
Reliable inference
      ↓
Derived information
```

rather than:

```text
Common framework behavior
      ↓
Assumption
      ↓
Generated documentation
```

The latter can produce inaccurate documentation.

---

## 3. Explicit data flow

Information should move through clearly defined structures.

The major data boundary is:

```text
ScanResult
    ↓
ProjectAnalysis
    ↓
DocumentationPlan
    ↓
Markdown
```

---

## 4. Minimal side effects

Analysis should primarily transform data.

Filesystem operations are concentrated in the scanning and writing layers rather than spread throughout the system.

---

## 5. Safety boundaries are architectural boundaries

Security behavior is not an optional layer added after analysis.

The following are part of the architecture:

* Secret filtering
* Resource limits
* Symlink restrictions
* Permission prompts
* Static analysis
* Safe writing
* Atomic writes
* Offline runtime behavior

---

# System Overview

At a high level:

```text
                       BuildFox
                          │
                          ▼
                    CLI Arguments
                          │
                          ▼
                 Read Permission Check
                          │
                          ▼
                    Project Scanner
                          │
                          ▼
                    File Classifier
                          │
                          ▼
               ┌──────────────────────┐
               │ Detection & Analysis │
               │                      │
               │ Technologies         │
               │ Purpose              │
               │ Features             │
               │ APIs                 │
               │ Models               │
               │ Commands             │
               │ Dependencies         │
               │ Architecture         │
               └──────────────────────┘
                          │
                          ▼
                   ProjectAnalysis
                          │
                          ▼
                 Documentation Planner
                          │
                          ▼
                 DocumentationPlan
                          │
                          ▼
                  Markdown Renderer
                          │
                          ▼
                   README Content
                          │
                          ▼
                  Write Permission
                          │
                          ▼
                    Safe Writer
                          │
                          ▼
                       README.md
```

---

# Repository Structure

The main implementation is organized as follows:

```text
src/
├── cli.ts
├── index.ts
├── types.ts
│
├── scanner/
│
├── detect/
│
├── analyze/
│
├── generate/
│
├── ui/
│
└── write/

rules/

tests/

scripts/

.github/
```

Additional repository-level files include:

```text
README.md
CONTRIBUTING.md
DEVELOPMENT.md
ARCHITECTURE.md
SECURITY.md
LICENSE
package.json
tsconfig.json
```

---

## `src/cli.ts`

The CLI entry point.

Responsibilities include:

* Parsing CLI arguments
* Coordinating the execution flow
* Handling permission flow
* Starting scanning and analysis
* Starting documentation generation
* Handling dry-run behavior
* Coordinating writing

---

## `src/index.ts`

Contains public exports.

---

## `src/types.ts`

Contains the important shared interfaces and types used across the application.

This is a critical data boundary because changes here can affect multiple pipeline stages.

Important structures include:

* `FileEntry`
* `ScanResult`
* `TechRule`
* `RuleSignal`
* `ProjectAnalysis`
* `DocumentationPlan`

---

## `src/scanner/`

Responsible for filesystem traversal, filtering, and classification-related scanning behavior.

---

## `src/detect/`

Responsible for loading detection rules and determining supported technologies from project evidence.

---

## `src/analyze/`

Responsible for extracting and deriving information from the scanned project.

This includes:

* Purpose
* Features
* APIs
* Models
* Commands
* Dependencies
* Architecture
* Application flow-related information

---

## `src/generate/`

Responsible for documentation planning and Markdown generation.

---

## `src/ui/`

Contains the CLI user-interface behavior, including permission prompts.

---

## `src/write/`

Responsible for safe README file writing and atomic file operations.

---

## `rules/`

Contains JSON technology detection rules.

---

## `tests/`

Contains the Vitest test suite.

---

## `scripts/`

Contains development/build-related scripts.

---

# Execution Pipeline

The main execution pipeline can be represented as:

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
dry-run?
   ↙       ↘
 yes       no
 ↓          ↓
print    confirmWritePermission()
             ↓
       writeReadmeFile()
             ↓
       atomicWriteFile()
```

Each stage has a specific role.

---

# CLI Layer

The CLI begins by parsing the user's command-line arguments.

The CLI layer is responsible for determining the requested operation and coordinating the rest of the application.

The CLI does not itself perform the detailed project analysis.

Instead, it invokes the appropriate pipeline stages.

This keeps command-line behavior separate from project-analysis logic.

---

# Permission Flow

BuildFox uses explicit permission checks for project access and output.

The general flow is:

```text
CLI
 ↓
Read permission
 ↓
Scan and analyze
 ↓
Generate content
 ↓
Write permission
 ↓
Write README
```

The distinction between reading and writing is important.

Analysis can be performed without modifying the analyzed project.

A generated README should only be written through the controlled writer flow.

---

# Scanner

The main scanner implementation is:

```text
src/scanner/walk.ts
```

The scanner recursively traverses the target project.

The implementation uses filesystem traversal based on:

```text
fs.readdirSync
```

and performs depth-first traversal.

---

## Scanner Boundaries

The scanner currently uses:

* Maximum depth: `6`
* Maximum files: `10,000`
* File-size limits
* Binary-file skipping
* Ignored directories
* Symlink skipping
* Sensitive-file filtering

These boundaries prevent uncontrolled traversal and reduce unnecessary processing.

---

## Ignored Directories

The scanner ignores common generated, dependency, cache, and tooling directories including:

```text
node_modules
.git
dist
build
.next
.dart_tool
__pycache__
venv
target
.gradle
.idea
.vscode
vendor
coverage
.cache
```

The purpose is to avoid analyzing generated or external content that should not normally be treated as application source.

---

## Symlink Handling

Symlinks are inspected using filesystem metadata and are skipped.

The scanner does not follow symlinks unrestrictedly.

This prevents traversal loops and helps maintain bounded analysis.

---

## Sensitive Files

Sensitive-file filtering is implemented through:

```text
src/scanner/filters.ts
```

Examples of sensitive material that is blocked include:

```text
.env
.env.local
*.pem
private keys
id_rsa
```

Environment template files such as:

```text
.env.example
.env.sample
.env.template
```

are treated differently and may provide variable names without exposing secret values.

---

## File Reading

The scanner is designed to:

* Read UTF-8 content
* Skip binary content
* Skip excessively large files
* Read lazily where appropriate
* Avoid unnecessary filesystem work

The current implementation uses a maximum readable file size of approximately 2 MB.

---

# File Classification

File classification is implemented in:

```text
src/scanner/classifier.ts
```

Classification determines the scope of discovered files.

Current scopes include:

```text
application
test
fixture
vendor
documentation
tooling
generated
```

Classification helps prevent unrelated files from becoming evidence for primary technology detection.

---

## Classification Examples

Examples include:

```text
__tests__/
*.spec.ts
*_test.go
```

for test-related content.

Examples and demos can be classified separately.

Vendor and third-party directories can be classified as vendor content.

Documentation such as:

```text
docs/*.md
```

can be classified as documentation.

Scripts, configuration, and GitHub workflow content can be classified as tooling.

Generated directories can be classified as generated content.

---

## Why Classification Matters

Without scope-aware classification, a technology appearing only inside:

* A fixture
* An example
* A test
* Documentation
* Tooling
* Generated output

could incorrectly appear to be a primary application technology.

Classification therefore feeds directly into more reliable detection.

---

# Detection Engine

The detection engine is implemented in:

```text
src/detect/engine.ts
```

The engine loads JSON-based technology rules and evaluates their signals against the scanned project.

---

## Detection Signals

The current rule system supports signals including:

```text
fileExists
dirExists
filePattern
fileContains
dependency
jsonPath
negative
```

Each signal can contribute a defined weight.

---

## Scope-Weighted Detection

Detection considers the scope of the evidence.

Primary technology scoring can use evidence from:

* Application
* Tooling
* Generated
* Unknown

Evidence from fixtures, examples, documentation, and other non-primary scopes is treated differently so that these sources do not incorrectly dominate detection.

---

## Confidence

Detection produces a `DetectedTechnology`.

Confidence is bounded at 100.

The current confidence interpretation includes:

```text
40+  → likely
70+  → detected
```

The exact scoring depends on the accumulated evidence and rule signals.

---

# Technology Detection Rules

Technology rules are stored as JSON under:

```text
rules/
```

Rules describe:

* Technology identifier
* Display name
* Category
* Detection signals

A rule can combine multiple evidence types.

---

## Example Rule

A simplified Svelte rule can be represented as:

```json
{
  "id": "svelte",
  "name": "Svelte",
  "category": "frontend",
  "signals": [
    { "type": "dependency", "target": "svelte", "weight": 60 },
    { "type": "filePattern", "target": "\\.svelte$", "weight": 20 }
  ]
}
```

The dependency signal provides stronger evidence than a generic file-pattern signal.

---

# Adding a Technology

Adding a technology generally requires changes in multiple areas.

The process is:

```text
Create rule
   ↓
Register rule
   ↓
Update fixture generator
   ↓
Generate fixture
   ↓
Add test
   ↓
Run detection validation
```

---

## 1. Create the Rule

Create the appropriate JSON rule under:

```text
rules/
```

---

## 2. Register the Rule

Register the rule in:

```text
src/detect/resolve.ts
```

through the built-in rule registry.

---

## 3. Update Fixture Generation

Update:

```text
tests/fixtures/create-fixtures.sh
```

to generate an appropriate fixture project.

---

## 4. Generate the Fixture

Run the fixture generation workflow described in:

**[DEVELOPMENT.md](DEVELOPMENT.md)**

---

## 5. Add an Assertion

Add an assertion to the appropriate detection test.

The expected detection should reach the appropriate confidence threshold for the intended detection behavior.

The research baseline uses a confidence of at least 70 for a technology to be considered detected.

---

## Rule Design Principles

Prefer strong, specific evidence.

### Strong evidence

Package dependencies that uniquely identify a technology can provide strong evidence.

Typical strong dependency signals can have weights around:

```text
60–80
```

---

### Weak evidence

Generic file extensions or weak patterns should normally have lower weights.

Typical weak pattern signals can have weights around:

```text
10–20
```

---

### Negative evidence

Negative signals can be used to reduce false positives where two technologies have overlapping evidence.

---

### Avoid overly generic content matching

Generic `fileContains` signals can easily create false positives.

Use specific evidence wherever possible.

---

# Source Analysis

Source analysis is implemented primarily under:

```text
src/analyze/
```

The analysis stage converts scanned evidence into higher-level project information.

This includes:

* Purpose
* Features
* APIs
* Models
* Commands
* Dependencies
* Architecture
* Application flow-related information

The analysis remains static.

---

# Purpose and Feature Inference

BuildFox can infer project purpose and features from available project evidence.

Evidence may include:

* README content
* Comments
* Docstrings
* Manifest descriptions
* Meaningful project names
* Source structure
* Other available project evidence

The result should remain evidence-bounded.

The system should not generate a feature merely because it is common for a detected technology.

---

# API Extraction

API extraction is implemented in:

```text
src/analyze/api-extractor.ts
```

The implementation uses regular-expression-based route extraction for supported frameworks and environments.

Examples of supported patterns include:

* Express
* FastAPI
* Flask
* Go
* Spring Boot
* Android
* Flutter

The exact extraction capability depends on the patterns visible to the analyzer.

---

## API Analysis Limitation

Regex-based extraction cannot fully understand arbitrary dynamic behavior.

Highly abstracted or dynamically constructed routes may not be visible to the extractor.

Generated documentation should therefore reflect only routes supported by the available evidence.

---

# Model Extraction

Model extraction is implemented in:

```text
src/analyze/model-extractor.ts
```

The analyzer uses regular-expression-based extraction for supported model patterns.

The research baseline includes support for patterns associated with:

* Django
* SQLAlchemy
* Mongoose

The exact extracted information depends on source patterns visible to the analyzer.

---

# Command Detection

Command detection is implemented in:

```text
src/analyze/command-detector.ts
```

It can use:

* `package.json` scripts
* Inferred standard commands

Commands become part of the project analysis and can subsequently be represented in generated documentation.

---

# Dependency Graph

Dependency extraction is implemented in:

```text
src/analyze/dependency-extractor.ts
```

The dependency graph provides relationships between project source files.

---

## Graph Nodes

Nodes represent source file paths.

```text
Node = source file
```

---

## Graph Edges

Edges represent relationships such as imports, requires, or other supported references.

```text
A → B
```

means that source file `A` depends on or references source file `B` according to the supported extraction rules.

---

## Dependency Extraction

The analyzer uses regular-expression-based detection of:

* Imports
* Requires
* Relative references

Relative paths are resolved using the scanned project's `fileMap`.

---

## Dependency Graph Limitations

The current approach has known limitations.

These include:

* Modern ESM edge cases
* Dynamic imports
* Highly abstracted dependency relationships
* Regex parsing limitations
* Potential regular-expression performance risks

Changes to dependency extraction should therefore be tested carefully.

---

# Architecture Inference

Architecture inference is implemented through:

```text
inferArchitecture
```

in:

```text
src/analyze/dependency-extractor.ts
```

Architecture inference uses concrete source relationships rather than simply assigning a generic architecture label.

Files are grouped according to path and naming evidence into architectural layers.

Examples include:

```text
controller
service
repository
presentation
```

The exact layers depend on the available project structure and evidence.

---

## Dependency-Based Relationships

The dependency graph contributes relationships between inferred layers.

For example:

```text
controller
    ↓
service
```

can result in a relationship where the controller layer depends on the service layer.

This produces architecture information based on actual source relationships.

---

# Application Flow

Application flow is rendered through:

```text
renderApplicationFlow
```

in:

```text
src/generate/content.ts
```

The flow is derived from architecture and dependency information.

---

## Flow Construction

The application flow can use:

* Architecture layers
* Dependency relationships
* Entry-point information
* Topological ordering

The flow can begin from entry-oriented layers such as:

```text
CLI
presentation
routing
```

and follow relationships toward:

```text
service
data
```

---

## Application Flow Limitations

Application flow is static.

It cannot fully track:

* Dynamic routing
* Runtime dependency injection
* Runtime-generated relationships
* Other behavior not visible through static analysis

The generated flow should therefore remain limited to relationships supported by the analysis.

---

# ProjectAnalysis

`ProjectAnalysis` is the central analysis object.

It acts as the single source of truth for documentation generation.

The documentation planner and renderer should consume the analysis rather than independently re-analyzing the project.

---

## ProjectAnalysis Information

The analysis can contain information such as:

```text
technologies
features
purpose
architecture
api
data
commands
```

The exact structure is defined by the project's shared types.

---

## Single Source of Truth

The intended flow is:

```text
Filesystem
    ↓
ScanResult
    ↓
ProjectAnalysis
    ↓
DocumentationPlan
    ↓
Generated Markdown
```

This prevents different documentation templates from independently inventing their own understanding of the project.

---

# Truth Model

BuildFox distinguishes between three kinds of information.

## Directly Observed

Information directly observed from the project.

Examples include:

* File count
* Environment variable names
* Commands

---

## Inferred

Information inferred from evidence.

Examples include:

* Technologies
* Project purpose

---

## Derived

Information calculated from other analysis.

Examples include:

* Architecture
* Dependency relationships
* API information derived from source patterns

---

## Why the Distinction Matters

Contributors should understand the difference between:

```text
Observed
Inferred
Derived
```

because each carries a different level of direct evidence.

The documentation system should not present an inferred or derived result as if it were directly observed when that distinction matters to accuracy.

---

# Documentation Planning

Documentation planning is implemented in:

```text
src/generate/planner.ts
```

The planner consumes the same `ProjectAnalysis` regardless of template.

Templates determine presentation depth rather than creating separate analysis systems.

---

## Planner Structure

The planner can add sections using a structure conceptually represented by:

```text
add(
  section-id,
  title,
  depth
)
```

Sections are added conditionally.

Empty or unsupported sections should be suppressed.

---

# Documentation Templates

BuildFox provides multiple documentation templates.

```text
Minimal
Standard
Detailed
Fancy
Pro
```

They represent different documentation depth and presentation levels over the same project analysis.

---

## Minimal

Focused on quick understanding and onboarding.

Typical areas include:

* Overview
* Features
* Technology
* Quick start

---

## Standard

Provides normal professional open-source documentation.

Typical areas include:

* Overview
* Features
* Technology
* Configuration
* Project tree
* Testing
* Other supported project information

---

## Detailed

Provides deeper technical documentation.

Typical areas include:

* Architecture
* Data models
* Testing
* CI/CD
* Technical details

---

## Fancy

Provides polished GitHub-oriented presentation.

It can include the depth of a standard-style document together with presentation elements such as:

* Badges
* Table of contents
* Additional visual polish

---

## Pro

Provides the deepest technical documentation level.

Potential areas include:

* Feature maps
* Environment variables
* API references
* Deep architecture information
* Other technically supported project information

---

## Conditional Documentation

The planner should not add a section simply because a template supports that section.

For example:

```text
No API evidence
    ↓
No API section
```

Likewise:

```text
No database evidence
    ↓
No database documentation
```

This keeps generated documentation factual.

---

# Markdown Rendering

Markdown generation is implemented primarily in:

```text
src/generate/content.ts
```

The renderer converts the planned analysis information into Markdown.

Pure rendering functions include areas such as:

```text
renderFeatures
renderApiSection
renderTechStackTable
renderApplicationFlow
```

The renderer can produce:

* Markdown headings
* Lists
* Tables
* Code blocks
* Documentation sections

---

## Renderer Boundary

The renderer should not perform filesystem discovery.

It should receive information from the analysis/planning stages and turn that information into Markdown.

This boundary prevents documentation formatting logic from becoming another project-analysis system.

---

# Safe File Writing

File writing is implemented through:

```text
src/write/writer.ts
src/write/atomic-write.ts
```

The writer is responsible for controlled output of the generated README.

---

## Write Flow

The general flow is:

```text
Generated README content
        ↓
Write permission
        ↓
Writer
        ↓
Atomic write
        ↓
README.md
```

---

## Atomic Writing

The writer uses a temporary file before replacing the target.

The temporary filename follows the project's temporary naming convention:

```text
.tmp.README.md.tmp.[hash]
```

The final replacement uses:

```text
fs.renameSync
```

This reduces the risk of leaving a partially written README.

---

## Backup Behavior

When replacing an existing README, the writer can create a backup using the project's backup naming convention:

```text
.README.md.backup.[timestamp]
```

---

## Dry Run

Dry-run behavior bypasses filesystem writes.

The generated content can be inspected without modifying the target project.

---

# Data Flow and Boundaries

The major architecture boundaries can be summarized as:

```text
┌────────────────────┐
│        CLI         │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│      Scanner       │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│    Classification  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Detection &        │
│ Source Analysis    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  ProjectAnalysis   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ DocumentationPlan  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Markdown Renderer  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│   Safe Writer      │
└────────────────────┘
```

Each stage should consume the appropriate data from the previous stage rather than bypassing the architecture unnecessarily.

---

# Architectural Separation Rules

## Scanner → Analysis

The scanner provides filesystem information.

Analysis interprets that information.

The scanner should not contain documentation-generation logic.

---

## Analysis → Planner

Analysis produces project understanding.

The planner determines what should be documented and at what depth.

The planner should not invent project capabilities.

---

## Planner → Renderer

The planner determines structure.

The renderer determines Markdown representation.

The renderer should not independently decide what technologies or features the project has.

---

## Renderer → Writer

The renderer produces content.

The writer handles filesystem output.

The renderer should not write files directly.

---

# Security Architecture

Security and privacy are integrated into the architecture.

Important controls include:

```text
Bounded scanner
      ↓
Secret filtering
      ↓
No symlink traversal
      ↓
Static analysis
      ↓
Explicit permissions
      ↓
Safe writer
      ↓
Atomic output
```

The runtime is also intentionally offline.

---

## No Runtime Network Dependency

The architecture does not require external services for project analysis.

Contributors should not add runtime network dependencies to the analysis pipeline.

---

## No Project Code Execution

The analyzer should inspect project files statically.

It should not execute the analyzed project's source code, scripts, package lifecycle commands, or other runtime behavior as part of normal analysis.

---

## Secret Protection

Sensitive files are filtered before they can become normal analysis input.

This is an architectural boundary and should not be bypassed for convenience.

---

## Symlink Protection

Symlinks are not followed unrestrictedly.

This prevents potential traversal loops and uncontrolled access outside the intended project tree.

---

# Performance and Resource Boundaries

The scanner intentionally limits analysis.

Current boundaries include:

```text
Maximum depth:      6
Maximum files:      10,000
Maximum file read:  approximately 2 MB
```

Additional controls include:

* Binary-file skipping
* Ignored directories
* Secret filtering
* Lazy reading
* Symlink skipping

These limits should be considered part of the architecture rather than arbitrary implementation details.

---

# Testing Architecture

BuildFox uses Vitest.

Testing follows the same subsystem boundaries as the implementation.

```text
Scanner
    ↓
secret.test.ts

Detection
    ↓
detect.test.ts
detect.matrix.test.ts
detect.negative.test.ts

Analysis
    ↓
analyze.test.ts

Dependencies
    ↓
dependency.test.ts

Architecture
    ↓
architecture.test.ts

Planner
    ↓
planner.test.ts

Generator
    ↓
generator.test.ts

Writer
    ↓
writer.test.ts
```

This organization allows changes to be validated at the appropriate architectural layer.

For development commands and testing workflow, see:

**[DEVELOPMENT.md](DEVELOPMENT.md)**

---

# Package Architecture

BuildFox is distributed as an npm package.

The package executable is configured through:

```text
package.json
```

with the CLI binary:

```text
buildfox
```

The package runtime depends on the compiled application and required runtime assets.

The source structure and package configuration therefore need to remain consistent.

When runtime files are added or moved, package contents should be verified.

---

# Cross-Platform Considerations

BuildFox is intended to support:

```text
Linux
macOS
Windows
```

Filesystem logic should therefore remain platform-aware.

Path normalization uses platform-aware separators, including normalization based on:

```text
path.sep
```

The project is intended to remain cross-platform, but the current CI validation described by the project is Linux-based.

Therefore:

```text
Passing Linux CI
        ≠
Complete Windows validation
```

Platform-specific behavior should be treated carefully when modifying filesystem logic.

---

# Known Architectural Limitations

The current architecture has several known limitations.

## Regular-expression-based analysis

Several analysis components rely on regular expressions rather than a full language AST.

This means some source constructs cannot be fully understood.

---

## Dynamic behavior

Static analysis cannot reliably observe all runtime behavior.

Examples include:

* Dynamic routing
* Dependency injection
* Runtime-generated dependencies
* Highly abstracted framework behavior

---

## Detection registry

Technology rules are currently registered through a hardcoded registry in:

```text
src/detect/resolve.ts
```

---

## Root-level project analysis

The current architecture analyzes a project at the root level.

Generating independent README files for individual monorepo sub-packages is not currently supported.

---

## Dependency extraction

Dependency extraction is based on supported static patterns and has limitations around:

* Modern ESM edge cases
* Dynamic behavior
* Highly abstracted imports
* Regex parsing limitations

---

## Architecture inference

Architecture inference depends on path, naming, and dependency evidence.

It should not be interpreted as a complete runtime architecture model.

---

## Documentation completeness

BuildFox intentionally prefers evidence-bounded output.

A smaller README can be correct when the analyzed project does not contain enough evidence for additional sections.

Completeness should not be achieved by adding unsupported information.

---

# Change Impact Map

The following map can help determine what areas may require validation after a change.

| Change Area                 | Potentially Affected Areas                               |
| --------------------------- | -------------------------------------------------------- |
| `src/cli.ts`                | CLI flow, permissions, execution pipeline                |
| `src/types.ts`              | Multiple pipeline stages                                 |
| `src/scanner/`              | Detection, analysis, security, performance               |
| `src/scanner/filters.ts`    | Security, scanner tests                                  |
| `src/scanner/classifier.ts` | Detection confidence, analysis                           |
| `src/detect/`               | Technology detection, generated technology documentation |
| `rules/`                    | Detection behavior, fixtures, detection tests            |
| `src/analyze/`              | ProjectAnalysis, planner, generated documentation        |
| `dependency-extractor.ts`   | Dependency graph, architecture, application flow         |
| `planner.ts`                | Template output and documentation structure              |
| `content.ts`                | Generated Markdown                                       |
| `src/write/`                | README output, backups, atomic writes                    |
| `tests/fixtures/`           | Detection test environment                               |
| `.github/workflows/`        | CI validation                                            |
| Package configuration       | Published package contents                               |

---

# Architecture Principles for Contributors

When modifying BuildFox, preserve these principles.

## Keep the pipeline explicit

Prefer:

```text
Scanner
→ Analysis
→ Planning
→ Rendering
→ Writing
```

over shortcuts that make one stage responsible for another stage's work.

---

## Keep analysis independent from templates

The same `ProjectAnalysis` should support the different documentation templates.

Do not create template-specific analysis hacks simply to produce additional content.

---

## Prefer evidence over assumptions

If the project does not provide sufficient evidence, omit the claim.

---

## Preserve safety boundaries

Do not weaken:

* Secret filtering
* Symlink restrictions
* Resource limits
* Permission controls
* Atomic writing
* Offline operation

---

## Avoid unnecessary dependencies

BuildFox is intentionally designed as a focused CLI.

Do not introduce large dependencies when existing platform or project functionality is sufficient.

---

## Keep parsing static

Do not execute analyzed project code to obtain information that could instead be obtained through static analysis.

---

## Keep renderer and analyzer responsibilities separate

The analyzer should understand the project.

The renderer should present the analysis.

Neither should become responsible for the other's entire role.

---

## Keep the ProjectAnalysis model authoritative

The generated documentation should ultimately be based on the central project analysis.

This prevents different components from developing conflicting interpretations of the same project.

---

# Architectural Reference Flow

The complete conceptual flow is:

```text
                         BuildFox CLI
                              │
                              ▼
                       Parse CLI Arguments
                              │
                              ▼
                    Confirm Read Permission
                              │
                              ▼
                         Scan Project
                              │
                              ▼
                     Classify Discovered Files
                              │
                              ▼
                  ┌───────────────────────────┐
                  │     Detection & Analysis  │
                  │                           │
                  │ Technology Detection      │
                  │ Purpose Inference         │
                  │ Feature Inference         │
                  │ API Extraction            │
                  │ Model Extraction          │
                  │ Command Detection         │
                  │ Dependency Extraction     │
                  │ Architecture Inference    │
                  └─────────────┬─────────────┘
                                │
                                ▼
                       ProjectAnalysis
                                │
                                ▼
                    Documentation Planner
                                │
                                ▼
                     DocumentationPlan
                                │
                                ▼
                      Markdown Renderer
                                │
                                ▼
                         README Content
                                │
                         ┌──────┴──────┐
                         │             │
                       Dry Run        Write
                         │             │
                         ▼             ▼
                      Display    Write Permission
                                       │
                                       ▼
                                 Safe Writer
                                       │
                                       ▼
                                Atomic Write
                                       │
                                       ▼
                                  README.md
```

This separation is the central architectural model of BuildFox.

---

# Related Documentation

* **[README.md](README.md)** — User-facing overview, installation, usage, and project information.
* **[CONTRIBUTING.md](CONTRIBUTING.md)** — Contribution process, contribution rules, testing expectations, and pull request guidance.
* **[DEVELOPMENT.md](DEVELOPMENT.md)** — Development commands, testing, fixtures, building, local CLI verification, and CI-related development workflow.
* **[SECURITY.md](SECURITY.md)** — Security policy and vulnerability reporting.

---

# Final Architectural Principle

BuildFox is fundamentally an evidence pipeline:

```text
Local Project
     ↓
Observed Evidence
     ↓
Classified Evidence
     ↓
Analysis
     ↓
ProjectAnalysis
     ↓
Documentation Plan
     ↓
Markdown
     ↓
Safe Output
```

The architecture should preserve the relationship between evidence and generated documentation.

The system should remain:

```text
Offline
Deterministic
Evidence-based
Privacy-conscious
Bounded
Maintainable
```

When extending BuildFox, preserve these properties before adding new functionality.
