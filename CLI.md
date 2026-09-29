# BuildFox CLI Reference

BuildFox is a command-line tool that analyzes a local project and generates a high-quality `README.md` from the project's actual structure, technologies, features, and architecture.

BuildFox uses a single command with optional flags rather than multiple subcommands.

---

## Basic Usage

```bash
buildfox [path]
```

If no path is provided, BuildFox analyzes the current working directory.

### Examples

```bash
buildfox
```

Analyze the current directory and generate `README.md`.

```bash
buildfox .
```

Explicitly analyze the current directory.

```bash
buildfox ./my-project
```

Analyze a specific project directory.

---

## Help

```bash
buildfox --help
```

or:

```bash
buildfox -h
```

Displays the BuildFox command-line usage guide and exits without running project analysis.

---

## Version

```bash
buildfox --version
```

or:

```bash
buildfox -v
```

Displays the installed BuildFox version.

Example:

```text
buildfox v1.0.0
```

---

## Templates

BuildFox supports five README templates:

* `minimal`
* `standard`
* `detailed`
* `fancy`
* `pro`

Use:

```bash
buildfox --template <type>
```

or:

```bash
buildfox -t <type>
```

### Examples

```bash
buildfox --template minimal
```

```bash
buildfox -t standard
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

Using `--template` skips the interactive template selection prompt.

### Template Names

| Template   | Purpose                                         |
| ---------- | ----------------------------------------------- |
| `minimal`  | Short README with essential project information |
| `standard` | Professional README for normal projects         |
| `detailed` | More comprehensive technical documentation      |
| `fancy`    | Polished presentation-oriented README           |
| `pro`      | Deep technical documentation                    |

An invalid template name exits with status code `1`.

---

## Output Path

By default, BuildFox writes:

```text
README.md
```

to the analyzed project directory.

To specify a different output file:

```bash
buildfox --out <path>
```

or:

```bash
buildfox -o <path>
```

### Example

```bash
buildfox --out docs/PROJECT-README.md
```

The specified output path is resolved relative to the target project directory.

---

## Dry Run

```bash
buildfox --dry-run
```

Runs the analysis and README generation pipeline but does not write anything to disk.

Instead, the generated Markdown is printed to the terminal.

Dry-run mode:

* performs project analysis
* generates the selected README
* prints the generated Markdown
* does not request write permission
* does not modify project files
* does not create a README backup

### Example

```bash
buildfox --template detailed --dry-run
```

This is useful when you want to inspect the generated README before allowing BuildFox to write it.

---

## Analyze Only

```bash
buildfox --analyze-only
```

Runs BuildFox's project analysis without generating or writing a README.

The command:

1. scans the project
2. analyzes the project structure
3. detects technologies and frameworks
4. extracts supported project information
5. prints the analysis summary
6. exits without planning or rendering a README

Example:

```bash
buildfox --analyze-only
```

This is useful when you want to inspect what BuildFox understands about a project without generating documentation.

---

## Automatic Read Permission

By default, BuildFox asks for permission before analyzing a project.

Use:

```bash
buildfox --yes
```

or:

```bash
buildfox -y
```

to automatically approve the **read permission** request.

### Important

`--yes` only approves read access.

It does **not** automatically approve writing the generated README.

BuildFox still requests write permission before modifying files.

Example:

```bash
buildfox --yes
```

---

## Disable Animation

```bash
buildfox --no-animation
```

Disables terminal loading animations and spinners.

This can be useful in:

* scripts
* terminals where animation is undesirable
* automated environments
* situations where a static terminal output is preferred

Example:

```bash
buildfox --yes --no-animation
```

---

## Combining Options

BuildFox options can be combined when their behaviors are compatible.

### Analyze with a specific template

```bash
buildfox --template detailed
```

### Preview a detailed README

```bash
buildfox --template detailed --dry-run
```

### Analyze a specific project

```bash
buildfox ./my-project --analyze-only
```

### Automatically approve read access

```bash
buildfox --yes
```

### Disable animation

```bash
buildfox --no-animation
```

### Generate a specific template to a custom file

```bash
buildfox --template pro --out docs/README.md
```

### Non-interactive preview

```bash
buildfox --yes --no-animation --dry-run
```

---

## Permission and Safety

BuildFox is designed to analyze projects locally and avoid unexpected modifications.

### Read Permission

By default, BuildFox asks for permission before reading the project.

```bash
buildfox
```

Use:

```bash
buildfox --yes
```

to approve read access automatically.

### Write Permission

Writing the generated README requires a separate permission.

There is currently **no flag that bypasses write permission**.

### Existing README

If the output file already exists, BuildFox creates a backup before overwriting it.

Backups use a timestamped filename similar to:

```text
.README.md.backup.<timestamp>
```

### Dry Run

`--dry-run` does not write files and does not create backups.

### Analyze Only

`--analyze-only` stops before README planning, rendering, and writing.

---

## Exit Codes

BuildFox uses the following exit codes:

|  Code | Meaning                                                   |
| ----: | --------------------------------------------------------- |
|   `0` | Successful execution or graceful user cancellation/denial |
|   `1` | Error or invalid command option                           |
| `130` | Process interrupted with `Ctrl+C`                         |

---

## Error Handling

### Invalid Template

```bash
buildfox --template unknown
```

Results in an error and exits with code `1`.

### Unknown Options

Unknown options produce a warning rather than immediately terminating the program.

Example:

```bash
buildfox --unknown-option
```

BuildFox reports the unknown option and continues according to the current CLI behavior.

### Missing Option Values

Options such as:

```bash
--template
```

and:

```bash
--out
```

require a value.

For example:

```bash
buildfox --template detailed
```

and:

```bash
buildfox --out README.generated.md
```

---

## Quick Reference

| Command / Option          | Description                               |
| ------------------------- | ----------------------------------------- |
| `buildfox [path]`         | Analyze a project and generate a README   |
| `-h`, `--help`            | Show CLI help                             |
| `-v`, `--version`         | Show BuildFox version                     |
| `-y`, `--yes`             | Automatically approve read permission     |
| `-t`, `--template <type>` | Select README template                    |
| `-o`, `--out <path>`      | Specify output file                       |
| `--dry-run`               | Generate and print README without writing |
| `--analyze-only`          | Analyze project without generating README |
| `--no-animation`          | Disable terminal animation                |

---

## Common Workflows

### Generate a README

```bash
buildfox
```

### Generate a standard README

```bash
buildfox --template standard
```

### Generate a detailed README

```bash
buildfox --template detailed
```

### Preview before writing

```bash
buildfox --dry-run
```

### Inspect project analysis

```bash
buildfox --analyze-only
```

### Analyze another project

```bash
buildfox /path/to/project
```

### Generate to a custom location

```bash
buildfox --out docs/README.md
```

### Run without terminal animation

```bash
buildfox --no-animation
```

### Fully automated preview

```bash
buildfox --yes --no-animation --dry-run
```

---

## Currently Supported CLI

BuildFox currently provides a single executable command:

```text
buildfox
```

with the following supported options:

```text
-h, --help
-v, --version
-y, --yes
-t, --template <type>
-o, --out <path>
--dry-run
--analyze-only
--no-animation
```

Future CLI functionality may be added while maintaining backwards compatibility with the existing command interface.
