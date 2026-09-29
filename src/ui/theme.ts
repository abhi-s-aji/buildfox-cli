import pc from 'picocolors';

/**
 * Sanitizes arbitrary string input to prevent ANSI escape sequence injection into terminal.
 * Neutralizes control characters except standard newlines and tabs.
 */
export function sanitizeTerminalOutput(str: string): string {
  if (typeof str !== 'string') return '';
  // Strip ANSI escape codes and dangerous control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)
  return str
    // eslint-disable-next-regex-line
    .replace(/[\u001b\u009b][[\Recorded]?:;?]*[a-zA-Z0-9]/g, '')
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

export const theme = {
  brand: (text: string) => pc.bold(pc.cyan(text)),
  title: (text: string) => pc.bold(pc.white(text)),
  subtitle: (text: string) => pc.dim(text),
  accent: (text: string) => pc.cyan(text),
  success: (text: string) => pc.green(text),
  warning: (text: string) => pc.yellow(text),
  error: (text: string) => pc.red(text),
  dim: (text: string) => pc.dim(text),
  bold: (text: string) => pc.bold(text),
  badge: (text: string) => pc.bgCyan(pc.black(` ${text} `)),
  statusDetected: (text = 'Detected') => pc.green(`[${text}]`),
  statusLikely: (text = 'Likely') => pc.yellow(`[${text}]`),
  statusSkipped: (text = 'Skipped') => pc.dim(`[${text}]`),
};
