import { theme } from './theme';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json') as { version: string };

export function renderHeader(): void {
  console.log(theme.brand('BUILD FOX') + ' ' + theme.dim(`v${version}`));
  console.log(theme.dim('Static Analysis & README Generator'));
  console.log();
}
