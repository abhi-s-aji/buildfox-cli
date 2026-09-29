# Security Policy

## Overview

BuildFox is designed as a **local, offline-first CLI tool** that analyzes source repositories and generates documentation.

Security and privacy are core design requirements. BuildFox should not require a user's source code, configuration, credentials, or project data to leave their machine.

BuildFox does not intentionally:

* Upload source code or project files
* Send project data to external services
* Use AI or cloud APIs at runtime
* Collect telemetry
* Execute analyzed project code
* Install dependencies into analyzed projects
* Modify source code or project configuration
* Follow symbolic links during project scanning
* Read known secret files

---

## Supported Versions

Security fixes are generally applied to the latest maintained version of BuildFox.

| Version                         | Supported    |
| ------------------------------- | ------------ |
| Latest release                  | Yes          |
| Older releases                  | Best effort  |
| Unreleased development versions | No guarantee |

Users should keep BuildFox updated when security fixes are released.

---

## Reporting a Vulnerability

Please **do not report security vulnerabilities through public GitHub issues**.

If you discover a security vulnerability in BuildFox, report it privately through the repository's GitHub security reporting mechanism.

**Security Advisory:**
[Report a vulnerability](https://github.com/abhi-s-aji/buildfox-cli/security/advisories/new)

When reporting a vulnerability, please include:

* A clear description of the issue
* The affected BuildFox version
* The affected operating system, if relevant
* Steps required to reproduce the issue
* A minimal proof of concept, when appropriate
* The potential security or privacy impact
* Any suggested mitigation, if known

Please avoid including real credentials, private keys, API tokens, personal information, or other sensitive data in a report.

---

## What Should Be Reported?

Security reports are appropriate for issues such as:

* Secret or credential exposure
* Unexpected network communication
* Remote code execution
* Local code execution caused by malicious project input
* Arbitrary file writes
* Path traversal
* Symbolic-link traversal
* Unsafe command execution
* Sensitive information disclosure
* Denial-of-service conditions caused by malicious project structures
* Dependency vulnerabilities with a meaningful security impact
* Bypasses of BuildFox's permission or safety controls
* Generated documentation containing sensitive project information
* Security issues in the npm package or published artifacts

If you are unsure whether an issue is security-related, it is safer to report it privately.

---

## Security Architecture

BuildFox follows a security-by-design approach.

### Offline Runtime

BuildFox does not require network access to analyze a project or generate a README.

The runtime architecture does not depend on:

* Cloud APIs
* AI services
* Remote analysis services
* Telemetry endpoints
* External databases

Contributors must not introduce network communication into the runtime without an explicit architectural decision and security review.

---

## Read-Only Project Analysis

The analyzed project is treated as an input source.

BuildFox should only read the files required for analysis.

The scanner must not:

* Modify source files
* Modify configuration files
* Install dependencies
* Run project commands
* Build the analyzed project
* Execute project code
* Start project services

Documentation generation should be based on static analysis and collected evidence.

---

## File-System Safety

BuildFox applies explicit boundaries when scanning repositories.

Current scanner protections include:

* Maximum scan depth
* Maximum number of files
* Maximum file-read size
* Binary-file detection
* Ignored build and dependency directories
* Secret-file filtering
* Symbolic-link blocking
* UTF-8-oriented text processing
* Lazy file reads

These protections help prevent unexpected resource consumption and reduce the amount of sensitive information exposed to the analyzer.

Contributors must not weaken these protections without a documented security reason and appropriate tests.

---

## Secret Protection

BuildFox intentionally avoids reading known secret-bearing files.

Examples include:

```text
.env
.env.local
*.pem
id_rsa
private keys
```

Environment example files such as:

```text
.env.example
.env.sample
.env.template
```

may be inspected for **variable names**, but their values must not be treated as secrets that should appear in generated documentation.

New secret-file patterns should be added when a credible exposure risk is identified.

Do not add rules that intentionally expose credentials, tokens, private keys, passwords, or other sensitive values.

---

## Symbolic Links

BuildFox does not follow symbolic links during repository scanning.

This is intentional.

Following symbolic links could allow a project to cause BuildFox to read files outside the intended project boundary or create recursive traversal scenarios.

Changes involving symbolic-link handling require dedicated tests and security consideration.

---

## Code Execution

BuildFox is intended to perform static analysis.

Contributors must not introduce mechanisms such as:

```text
eval()
child_process.exec()
child_process.spawn()
shell execution
project-script execution
```

for the purpose of analyzing projects.

A project's package scripts, build commands, configuration, or source code must be **read and analyzed**, not executed.

---

## Dependency Security

BuildFox should keep runtime dependencies minimal.

When adding a dependency, contributors should consider:

* Whether the dependency is actually necessary
* Whether the functionality can be implemented safely with Node.js APIs
* Whether the dependency introduces network access
* Whether it increases the attack surface
* Whether it is actively maintained
* Whether its license is compatible with BuildFox
* Whether it introduces unnecessary transitive dependencies

Security-sensitive dependencies should receive additional review before being introduced.

---

## Regular Expression Safety

Several BuildFox analyzers use regular expressions for static source analysis.

Contributors should be particularly careful when modifying regular expressions used by:

* API extraction
* Model extraction
* Dependency extraction
* Source classification
* Technology detection

Poorly designed expressions can introduce excessive CPU consumption or catastrophic backtracking when processing large or maliciously constructed files.

Prefer simple, bounded expressions and add regression tests for unusual input.

---

## Generated Documentation Safety

Generated documentation must remain evidence-based.

BuildFox must not invent:

* API endpoints
* Credentials
* Environment values
* Database details
* Authentication mechanisms
* Features
* Deployment infrastructure
* Architecture components

If information cannot be supported by project evidence, it should be omitted or represented conservatively.

This is both a documentation-quality requirement and a security requirement.

---

## Permission Model

BuildFox separates project analysis from writing.

Analysis should remain read-only.

Writing `README.md` requires explicit permission unless the user has provided the appropriate non-interactive permission flag.

Important safety behaviors include:

* Existing README files require explicit replacement permission
* `--dry-run` must not write files
* `--analyze-only` must not write files
* README replacement may create a backup
* File writes should use the safe/atomic writer
* Permission denial must not silently result in another output file

Changes to this behavior require tests because accidental file modification can result in data loss.

---

## Atomic File Writes

README generation uses an atomic writing strategy.

The intended sequence is:

1. Generate the complete README content.
2. Write it to a temporary file.
3. Complete the write successfully.
4. Atomically rename the temporary file into place.
5. Preserve an appropriate backup when replacing an existing README.

This reduces the risk of leaving a partially written README after an interruption or filesystem failure.

---

## Privacy

BuildFox is designed to keep project analysis local.

The tool should not collect or transmit:

* Source code
* File contents
* Environment variable values
* Credentials
* Project names
* Repository metadata
* Usage statistics
* Analytics
* Telemetry

Any future change involving external communication must be explicitly documented and reviewed before implementation.

---

## Reporting Sensitive Findings

If a security report contains sensitive information, do not include real secrets in the report.

For example, replace:

```text
API_KEY=actual-secret-value
```

with:

```text
API_KEY=<redacted>
```

Use minimal reproducible examples whenever possible.

---

## Security Fix Process

When a vulnerability is reported, maintainers should:

1. Confirm and reproduce the issue.
2. Determine the affected component and versions.
3. Assess the security impact.
4. Develop and test a fix.
5. Add regression coverage where appropriate.
6. Review the fix for related attack paths.
7. Publish an advisory when appropriate.
8. Release a patched version.
9. Document the security fix when appropriate.

Security fixes should avoid unnecessary changes to unrelated functionality.

---

## Contributor Security Responsibilities

Contributors are expected to preserve BuildFox's security model.

Before submitting a security-sensitive change, verify that it does not:

* Introduce network communication
* Execute project code
* Follow symbolic links
* Expose secrets
* Bypass permission prompts
* Write outside the intended output location
* Remove scanner resource limits
* Introduce unsafe regular expressions
* Trust unvalidated project-controlled paths
* Add unnecessary runtime dependencies
* Leak sensitive information into generated documentation

Security-sensitive behavior should have tests covering both the expected behavior and relevant failure cases.

---

## Security Testing

Security-sensitive changes should include appropriate tests.

Examples include:

* Secret-file filtering tests
* Path traversal tests
* Symbolic-link handling tests
* Permission-flow tests
* Safe writer tests
* Malicious or oversized input tests
* Regular-expression regression tests
* Generated-documentation disclosure tests

The existing test suite should remain passing before a security-related pull request is merged.

---

## Scope

This security policy covers:

* The BuildFox CLI
* BuildFox source code
* The published npm package
* BuildFox's scanning and analysis behavior
* Documentation generation
* File-writing behavior
* Official BuildFox repository infrastructure where applicable

Third-party projects analyzed by BuildFox are outside the direct control of the BuildFox maintainers.

---

## Responsible Disclosure

Please allow maintainers reasonable time to investigate and address a privately reported vulnerability before publicly disclosing technical details.

Coordinated disclosure helps protect BuildFox users while a fix is being developed and released.

Thank you for helping keep BuildFox secure.
