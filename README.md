# BuildFox

**Deterministic, privacy-first CLI that analyzes software projects and generates accurate README documentation from static evidence.**

BuildFox reads your project — not runs it. It scans source files, configuration, and dependencies using static analysis to understand what a project actually does, then generates a README that reflects reality.

---

## Why BuildFox?

Most README generators produce generic templates. BuildFox extracts evidence-backed documentation:

- Technology detection via a configurable rules engine
- API endpoint extraction from Express, Django, Flask, FastAPI, Go, and Spring routes
- Database model extraction from Django ORM, SQLAlchemy, and Android Room
- Architecture inference from actual import graphs
- Dependency-aware application flow description
- Five distinct README templates for different presentation needs

BuildFox is **offline-only**, **read-only toward analyzed projects**, and **deterministic** — identical projects produce identical outputs.

---

## Installation

```bash
npm install -g buildfox
```

Requires **Node.js ≥ 18**.

---

## Basic Usage

```bash
# Analyze current directory and generate README
buildfox

# Analyze a specific project
buildfox /path/to/your/project

# Preview output without writing files
buildfox --dry-run --template pro

# Skip permission prompts (read only; write still requires confirmation)
buildfox --yes

# Inspect what BuildFox found without generating anything
buildfox --analyze-only
```

---

## CLI Reference

```
buildfox [path] [options]

ARGUMENTS:
  path                     Project directory to analyze (default: current directory)

OPTIONS:
  -y, --yes                Pre-approve read access
  --dry-run                Print README output to terminal without writing files
  -t, --template <type>    README template: minimal, standard, detailed, fancy, pro
  -o, --out <path>         Output file path (default: README.md)
  --no-animation           Disable spinner animations
  --analyze-only           Show analysis findings only, no README generation
  -h, --help               Show help
  -v, --version            Show version
```

---

## Template System

BuildFox ships five distinct templates representing different depth and audience needs:

| Template   | Target Length | Purpose                                              |
| ---------- | ------------- | ---------------------------------------------------- |
| `minimal`  | 40–100 lines  | Fast introduction and quick start                    |
| `standard` | 100–200 lines | Complete professional README for most projects       |
| `detailed` | 200–350 lines | Developer-facing technical documentation             |
| `fancy`    | 100–220 lines | Presentation-oriented GitHub README with TOC, badges |
| `pro`      | 400–500+ lines| Deep technical reference for complex projects        |

Templates are **evidence-driven**: sections only appear when evidence exists. A small project will produce a shorter Pro README than a large one — this is correct behavior.

---

## Safety and Privacy Model

BuildFox is designed with a strict read-only contract:

**May read:**
- Source files, configuration, manifests, CI configuration
- `.env.example`, `.env.sample` (variable names only — never values)

**May write:**
- `README.md` (only after explicit permission confirmation)
- `README.md.bak` (automatic backup before any replacement)

**Never:**
- Reads `.env`, `.pem`, private keys, or secret files
- Executes project code or scripts
- Invokes shell commands against the analyzed project
- Contacts external servers
- Collects analytics or telemetry
- Modifies source files, `package.json`, tests, or configuration
- Writes files without explicit per-session approval
- Follows symlinks outside the scan boundary

Write permission is **always** requested interactively, even with `--yes`. The `--yes` flag only pre-approves reading.

---

## Supported Technologies

**Languages:** JavaScript, TypeScript, Python, Go, Java, Kotlin, Dart

**Runtimes & Platforms:** Node.js, Android

**Frontend:** React, Next.js, Vue, Angular, Flutter

**Backend:** Express, Django, Flask, FastAPI, Spring Boot

**Infrastructure:** Docker, GitHub Actions

**Package Managers:** npm, yarn, pnpm, pip, poetry, gradle, maven

**Testing:** Vitest, Jest, pytest, JUnit, go test

---

## Example Workflow

```bash
# Navigate to a project
cd /path/to/my-api-project

# Preview what BuildFox detects
buildfox --analyze-only

# Preview the Pro template output
buildfox --dry-run --template pro

# Generate the README
buildfox --template pro
```

BuildFox will:
1. Ask for read permission (or skip if `--yes`)
2. Scan the project directory
3. Run the analysis and show findings
4. Ask for write permission before creating or replacing `README.md`
5. Create a backup if an existing README is found

---

## Development Setup

```bash
git clone https://github.com/buildfox/buildfox-cli.git
cd buildfox-cli
npm install
npm run build
npm test
```

Run locally with `tsx` (no build step):
```bash
npm run dev -- --help
npm run dev -- /path/to/test/project --dry-run
```

Type-check only:
```bash
npm run typecheck
```

---

## Project Architecture

```
src/
  scanner/     — Directory walk, file filtering, scope classification, secret protection
  detect/      — Rules engine, technology detection, cross-cutting concerns
  analyze/     — Evidence aggregation, API extraction, model extraction, dependency graph
  generate/    — DocumentationPlanner, five template definitions, content renderers
  write/       — Atomic file writes, backup creation, dry-run support
  ui/          — Terminal output, prompts, spinner, theme
  cli.ts       — CLI entry point and argument parser
  types.ts     — Shared types
```

Detection rules live in `rules/*.json`. Each rule defines weighted signals for one technology.

---

## Testing

```bash
npm test          # Run the full test suite
npm run test:watch  # Watch mode during development
```

The test suite covers: scanner behavior, scope classification, technology detection (positive, negative, false-positive resistance), analysis, all five templates, section planning, writer, and CLI argument parsing.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Security

See [SECURITY.md](SECURITY.md).

---

## License

MIT — see [LICENSE](LICENSE).
