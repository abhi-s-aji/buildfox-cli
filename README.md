<div align="center">

# BUILDFOX

### Generate better README files from your project — automatically.

[![npm](https://img.shields.io/npm/v/buildfox?logo=npm)](https://www.npmjs.com/package/buildfox) [![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js\&logoColor=white)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

BuildFox is an offline-first CLI that analyzes your project and generates a structured, evidence-based `README.md` without modifying your source code.

</div>

---

## What is BuildFox?

BuildFox is a command-line tool for developers who want useful project documentation without manually writing the first draft of every `README.md`.

It analyzes the structure and contents of a project, detects technologies and development patterns, extracts meaningful information, and generates documentation based on what the project actually contains.

BuildFox is designed to be:

* **Offline** — no cloud service or AI API is required at runtime.
* **Evidence-based** — documentation is generated from detected project evidence.
* **Deterministic** — the same project produces consistent analysis.
* **Safe** — analyzed project files are treated as read-only except for explicitly approved README output.
* **Cross-platform** — designed for Linux, macOS, and Windows.
* **Open source** — released under the MIT License.

---

## Why BuildFox?

Writing a README is easy to postpone.

As a project grows, however, documentation needs to explain more than its name and installation command. A useful README may need to describe:

* What the project does
* Technologies used
* Important features
* How the application is structured
* Application flow
* APIs and routes
* Data models
* Dependencies
* Entry points
* Configuration
* Development and testing information

BuildFox automates the analysis required to produce this information while keeping the generated documentation grounded in the project itself.

---

## Features

### Project Analysis

BuildFox scans the current project and builds a structured understanding of its contents.

It can identify:

* Programming languages
* Frameworks and runtimes
* Application technologies
* Backend technologies
* Testing tools
* Docker and CI/CD configuration
* Package managers
* Environment configuration
* Monorepo-related tooling

Detection is rule-based and evidence-backed.

### Source Analysis

BuildFox goes beyond filenames and dependency lists.

Depending on the project, it can analyze:

* Project purpose
* Features
* Entry points
* API routes
* Data models
* Dependencies
* Application flow
* Architecture relationships

The generated documentation is based on concrete project evidence rather than generic descriptions.

### Multiple Documentation Templates

Choose the documentation depth that fits your project:

| Template   | Purpose                                    |
| ---------- | ------------------------------------------ |
| `minimal`  | Short project introduction and quick start |
| `standard` | Professional general-purpose README        |
| `detailed` | Deeper technical documentation             |
| `fancy`    | Polished GitHub-oriented presentation      |
| `pro`      | Deep technical reference                   |

Templates control presentation and documentation depth while using the same underlying project analysis.

### Safety First

BuildFox is designed to analyze projects without taking control of them.

It:

* Does not execute analyzed project code
* Does not install project dependencies
* Does not run shell commands against the analyzed project
* Does not follow symbolic links
* Blocks common secret and private-key files
* Skips binary and oversized files
* Does not send project data to a server
* Does not use telemetry
* Does not require an AI service
* Uses atomic README writes
* Can create a backup before replacing an existing README

---

## How It Works

```text
   Project
       │
       ▼
┌───────────────┐
│    Scanner    │
└───────┬───────┘
        │
        ▼
┌────────────────┐
│    Analysis    │
│                │
│ • Technologies │
│ • Features     │
│ • APIs         │
│ • Models       │
│ • Dependencies │
│ • Architecture │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Documentation  │
│    Planner     │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│    Template    │
│    Renderer    │
└───────┬────────┘
        │
        ▼
     README.md
```

The scanner first identifies relevant project files. The analysis layer extracts evidence from those files. The documentation planner decides which sections are meaningful for the selected template, and the renderer produces the final Markdown document.

Empty or unsupported sections are omitted rather than filled with generic content.

---

## Installation

BuildFox is available through npm and can be installed on **Linux, macOS, and Windows**.

### Linux

Make sure [Node.js](https://nodejs.org/) 18 or newer is installed.

Then:

```bash
npm install -g buildfox
```

Verify the installation:

```bash
buildfox --version
```

### macOS

Make sure [Node.js](https://nodejs.org/) 18 or newer is installed.

Then:

```bash
npm install -g buildfox
```

Verify the installation:

```bash
buildfox --version
```

### Windows

Make sure [Node.js](https://nodejs.org/) 18 or newer is installed.

Open **PowerShell** or **Command Prompt**, then run:

```powershell
npm install -g buildfox
```

Verify the installation:

```powershell
buildfox --version
```

### Run Without Global Installation

You can also run BuildFox directly through `npx`:

```bash
npx buildfox
```

---

## Usage

Navigate to the project you want to document:

```bash
cd your-project
```

Run BuildFox:

```bash
buildfox
```

BuildFox will analyze the project and generate:

```text
README.md
```

### Choose a Template

```bash
buildfox --template minimal
```

```bash
buildfox --template standard
```

```bash
buildfox --template detailed
```

```bash
buildfox --template fancy
```

```bash
buildfox --template pro
```

### Preview Without Writing

Use dry-run mode:

```bash
buildfox --dry-run
```

### Analyze Without Generating a README

```bash
buildfox --analyze-only
```

### Specify an Output Path

```bash
buildfox --out docs/README.md
```

### Skip Animation

```bash
buildfox --no-animation
```

### Skip the Read Permission Prompt

```bash
buildfox --yes
```

`--yes` applies to the read permission step. It does not automatically grant permission to overwrite an existing README.

### Check the Version

```bash
buildfox --version
```

### Show Help

```bash
buildfox --help
```

---

## Command Reference

| Command / Option    | Description                                       |
| ------------------- | ------------------------------------------------- |
| `buildfox`          | Analyze the current project and generate a README |
| `--yes`             | Automatically approve the read permission prompt  |
| `--dry-run`         | Preview output without writing files              |
| `--template <name>` | Select a documentation template                   |
| `--out <path>`      | Write the generated README to a specific path     |
| `--no-animation`    | Disable terminal animation                        |
| `--analyze-only`    | Analyze the project without writing a README      |
| `--version`         | Display the installed BuildFox version            |
| `--help`            | Display command help                              |

---

## Supported Project Technologies

BuildFox currently includes detection rules for technologies including:

**Languages**

JavaScript · TypeScript · Python · Go · Java · Kotlin · Dart

**Frameworks & Platforms**

React · Next.js · Vue · Angular · Flutter · Android

**Backend**

Express · Django · Flask · FastAPI · Spring Boot

**Tooling**

Docker · GitHub Actions · Testing frameworks · Monorepo tooling · Environment configuration

Detection is based on project evidence rather than simply listing every technology mentioned anywhere in the repository.

---

## Privacy & Offline Operation

BuildFox is designed for local project analysis.

Your project does not need to be uploaded to a BuildFox server.

At runtime, BuildFox:

* Works locally
* Does not require an internet connection
* Does not use AI APIs
* Does not send telemetry
* Does not upload source code
* Does not install dependencies into the analyzed project

This makes BuildFox suitable for projects where source code should remain on the developer's machine.

---

## Safe Project Analysis

BuildFox applies boundaries when scanning projects.

The scanner:

* Limits traversal depth
* Limits the number of scanned files
* Limits individual file size
* Ignores common generated and dependency directories
* Does not follow symbolic links
* Reads UTF-8 text files
* Skips binary files
* Blocks common secret and private-key files

Examples of ignored directories include:

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

Environment example files can be inspected for variable names, while sensitive environment values are not treated as documentation content.

---

## README Writing Safety

Existing README files are not silently overwritten.

When an existing `README.md` is detected, BuildFox requires explicit permission before replacing it.

When replacement is approved, BuildFox can create a backup before writing the new README.

The generated README is written atomically to reduce the risk of leaving a partially written document.

---

## Cross-Platform

BuildFox is intended to work across:

* Linux
* macOS
* Windows

It is implemented as a Node.js CLI and does not depend on platform-specific shell commands.

Requires:

```text
Node.js >= 18
```

---

## Contributing

BuildFox is open source, and contributions are welcome.

If you want to contribute, improve BuildFox, fix a bug, add detection rules, or work on the project from source, please read the contribution guidelines first.

**[Contributing Guidelines](./CONTRIBUTING.md)**

You can also visit the project repository:

[![GitHub](https://img.shields.io/badge/GitHub-abhi--s--aji-181717?logo=github\&logoColor=white)](https://github.com/abhi-s-aji/buildfox-cli)

---

## Security

Security issues should be reported responsibly.

Please read the security policy before reporting a vulnerability.

**[Security Policy](./SECURITY.md)**


## License

BuildFox is released under the **MIT License**.

---

## Author

<div align="center">

### Abhi S Aji

[![GitHub](https://img.shields.io/badge/GitHub-abhi--s--aji-181717?logo=github\&logoColor=white)](https://github.com/abhi-s-aji)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Abhi%20S%20Aji-0A66C2?logo=linkedin\&logoColor=white)](https://www.linkedin.com/in/abhi-s-aji-eden/)

[![Hashnode](https://img.shields.io/badge/Hashnode-abhi--s--aji-2962FF?logo=hashnode\&logoColor=white)](https://hashnode.com/@abhi-s-aji)

[![Email](https://img.shields.io/badge/Email-abhisaji.dev%40gmail.com-EA4335?logo=gmail\&logoColor=white)](mailto:abhisaji.dev@gmail.com)

[![Email](https://img.shields.io/badge/Email-abhisajieden%40gmail.com-EA4335?logo=gmail\&logoColor=white)](mailto:abhisajieden@gmail.com)

</div>

---

<div align="center">

**BuildFox — Analyze. Understand. Document.**

</div>
