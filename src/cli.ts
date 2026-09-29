import * as path from 'node:path';
import { CliOptions, TemplateType } from './types';
import { renderHeader } from './ui/logo';
import { theme } from './ui/theme';
import { Spinner } from './ui/spinner';
import {
  setupSignalHandlers,
  confirmReadPermission,
  confirmWritePermission,
  selectTemplate,
} from './ui/prompts';
import {
  printError,
  printSuccess,
  printAnalysisSummary,
  printPreviewSummary,
} from './ui/output';
import { scanProject } from './scanner/walk';
import { analyzeProject } from './analyze/evidence';
import { generateReadmeContent } from './generate/render';
import { writeReadmeFile } from './write/writer';
import * as fs from 'node:fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: pkgVersion } = require('../package.json') as { version: string };


export function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    targetDir: process.cwd(),
    yes: false,
    dryRun: false,
    noAnimation: false,
    analyzeOnly: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (arg === '--yes' || arg === '-y') {
      options.yes = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--no-animation') {
      options.noAnimation = true;
    } else if (arg === '--analyze-only') {
      options.analyzeOnly = true;
    } else if (arg === '--template' || arg === '-t') {
      const val = args[++i]?.toLowerCase();
      const validTemplates = ['minimal', 'standard', 'detailed', 'fancy', 'pro'];
      if (validTemplates.includes(val)) {
        options.template = val as TemplateType;
      } else {
        console.error(`Error: Invalid template "${val}". Valid templates: ${validTemplates.join(', ')}`);
        process.exit(1);
      }
    } else if (arg === '--out' || arg === '-o') {
      options.out = args[++i];
    } else if (!arg.startsWith('-')) {
      options.targetDir = path.resolve(arg);
    } else {
      // Unknown flag — warn but continue
      console.error(`Warning: Unknown option "${arg}". Run --help for usage.`);
    }
  }

  return options;
}

export function printHelp(): void {
  renderHeader();
  console.log(`
${theme.bold('USAGE:')}
  $ buildfox [path] [options]

${theme.bold('ARGUMENTS:')}
  path                     Directory of the project to analyze (default: current directory)

${theme.bold('OPTIONS:')}
  -y, --yes                Pre-approve read access (write permission is still explicitly asked)
  --dry-run                Analyze project and print README output to terminal without writing files
  -t, --template <type>    Specify README template (minimal, standard, detailed, fancy, pro)
  -o, --out <path>         Specify output file path (default: README.md)
  --no-animation           Disable terminal spinner animations
  --analyze-only           Perform static analysis and print findings without generating a README
  -h, --help               Show this help message
  -v, --version            Show BuildFox CLI version
`);
}

export async function main(): Promise<void> {
  setupSignalHandlers();

  const args = process.argv.slice(2);
  const options = parseCliArgs(args);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.version) {
    console.log(`buildfox v${pkgVersion}`);
    process.exit(0);
  }

  renderHeader();

  // 1. Confirm Read Permission
  const readAllowed = await confirmReadPermission(options.targetDir, options.yes);
  if (!readAllowed) {
    console.log(theme.warning('Read permission denied. Exiting without scanning.'));
    process.exit(0);
  }

  // 2. Scan Project
  const spinner = new Spinner({ noAnimation: options.noAnimation });
  spinner.start('Scanning directory...');

  const scan = scanProject(options.targetDir);
  spinner.stop(`Scanned ${scan.files.length} project files`);

  // 3. Analyze Project
  spinner.start('Analyzing project structure & source code...');
  const analysis = analyzeProject(scan);
  spinner.stop('Analysis complete');

  // 4. Print Analysis Summary
  printAnalysisSummary(analysis);

  if (options.analyzeOnly) {
    console.log(theme.success('Analysis complete (--analyze-only mode). No files modified.'));
    process.exit(0);
  }

  // 5. Select Template
  let template: TemplateType;
  if (options.template) {
    template = options.template;
  } else {
    template = await selectTemplate('standard');
  }

  // 6. Generate README Content
  const renderRes = generateReadmeContent(template, analysis);

  const targetOutputPath = options.out
    ? path.resolve(options.targetDir, options.out)
    : path.join(options.targetDir, 'README.md');

  // 7. Handle Dry Run
  if (options.dryRun) {
    console.log(theme.bold('Dry Run Mode Active: Output previewing below (no files will be written):\n'));
    writeReadmeFile({
      targetDir: options.targetDir,
      outputPath: targetOutputPath,
      content: renderRes.content,
      allowReplace: false,
      dryRun: true,
    });
    console.log(theme.success('Dry run complete. No files written.'));
    process.exit(0);
  }

  // 8. Print Preview Summary
  printPreviewSummary(
    template,
    targetOutputPath,
    renderRes.lineCount,
    renderRes.sections
  );

  // 9. Confirm Write Permission
  const fileExists = fs.existsSync(targetOutputPath);
  const writeAllowed = await confirmWritePermission(targetOutputPath, fileExists);

  if (!writeAllowed) {
    console.log(theme.warning('Write permission denied. Exiting without modifying files.'));
    process.exit(0);
  }
  const allowReplace = fileExists;

  // 10. Perform Atomic Write
  try {
    const writeRes = writeReadmeFile({
      targetDir: options.targetDir,
      outputPath: targetOutputPath,
      content: renderRes.content,
      allowReplace,
    });

    printSuccess(`README generated successfully at ${writeRes.outputPath}`);
    if (writeRes.backupPath) {
      console.log(`  ${theme.dim('Backup created at:')} ${writeRes.backupPath}`);
    }
    console.log(`  ${theme.dim('Lines written:')}   ${writeRes.linesWritten}`);
    console.log(`  ${theme.dim('File size:')}       ${writeRes.bytesWritten} bytes\n`);
  } catch (err: any) {
    printError('Failed to write README file', err?.message || String(err));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    printError('Unexpected failure', err?.message || String(err));
    process.exit(1);
  });
}
