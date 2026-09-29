import * as readline from 'node:readline';
import { TemplateType } from '../types';
import { theme, sanitizeTerminalOutput } from './theme';

export function setupSignalHandlers(): void {
  process.on('SIGINT', () => {
    console.log('\n');
    console.log(theme.warning('Operation cancelled by user. Exiting.'));
    // Ensure cursor is visible
    process.stdout.write('\x1B[?25h');
    process.exit(130);
  });
}

export async function askConfirmation(
  question: string,
  defaultYes = false
): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptSuffix = defaultYes ? ' (Y/n) ' : ' (y/N) ';
  return new Promise<boolean>((resolve) => {
    rl.question(theme.bold(question) + theme.dim(promptSuffix), (answer: string) => {
      rl.close();
      const cleaned = answer.trim().toLowerCase();
      if (cleaned === '') {
        resolve(defaultYes);
      } else {
        resolve(cleaned === 'y' || cleaned === 'yes');
      }
    });
  });
}

export async function confirmReadPermission(
  targetDir: string,
  autoApprove = false
): Promise<boolean> {
  const safeDir = sanitizeTerminalOutput(targetDir);
  console.log(`${theme.bold('Target Project:')} ${theme.accent(safeDir)}`);

  if (autoApprove) {
    console.log(`${theme.dim('Pre-approved read permission via --yes flag.')}`);
    return true;
  }

  const allowed = await askConfirmation('Read project files? Allow?');
  return allowed;
}

export async function confirmWritePermission(
  outputPath: string,
  isReplacement: boolean
): Promise<boolean> {
  const safePath = sanitizeTerminalOutput(outputPath);

  if (isReplacement) {
    console.log(theme.warning(`Existing file found at ${safePath}. A backup will be created.`));
  }

  const allowed = await askConfirmation(`Write ${safePath}? Allow?`);
  return allowed;
}

export async function selectTemplate(
  defaultTemplate: TemplateType = 'standard'
): Promise<TemplateType> {
  const options: { key: TemplateType; label: string; desc: string }[] = [
    { key: 'minimal', label: 'Minimal', desc: 'Essential project overview and quick start' },
    { key: 'standard', label: 'Standard', desc: 'Balanced professional README for most projects' },
    { key: 'detailed', label: 'Detailed', desc: 'Deep technical documentation for developers' },
    { key: 'fancy', label: 'Fancy', desc: 'Polished, visually structured GitHub README' },
    { key: 'pro', label: 'Pro', desc: 'Comprehensive technical reference for complex projects' },
  ];

  if (!process.stdin.isTTY) {
    return defaultTemplate;
  }

  console.log('\n' + theme.bold('Select README Template:'));
  options.forEach((opt, idx) => {
    const isDefault = opt.key === defaultTemplate;
    const numStr = theme.accent(`[${idx + 1}]`);
    const nameStr = theme.bold(opt.label.padEnd(10));
    const descStr = theme.dim(`[${opt.desc}]`);
    const marker = isDefault ? theme.accent(' (default)') : '';
    console.log(`  ${numStr} ${nameStr} ${descStr}${marker}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<TemplateType>((resolve) => {
    rl.question('\nEnter selection [1-5] (default: 2): ', (answer: string) => {
      rl.close();
      const num = parseInt(answer.trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        resolve(options[num - 1].key);
      } else {
        const found = options.find((o) => o.key === answer.trim().toLowerCase());
        if (found) {
          resolve(found.key);
        } else {
          resolve(defaultTemplate);
        }
      }
    });
  });
}
