import { theme } from './theme';

export interface SpinnerOptions {
  noAnimation?: boolean;
}

export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private timer: NodeJS.Timeout | null = null;
  private isInteractive: boolean;
  private text = '';

  constructor(options: SpinnerOptions = {}) {
    this.isInteractive =
      !options.noAnimation &&
      process.stdout.isTTY &&
      process.env.CI === undefined &&
      process.env.NO_COLOR === undefined;
  }

  public start(text: string): void {
    this.text = text;
    if (!this.isInteractive) {
      console.log(`${theme.accent('•')} ${text}...`);
      return;
    }

    process.stdout.write(`\x1B[?25l${theme.accent(this.frames[0])} ${text}`);
    this.timer = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      process.stdout.write(`\r\x1B[K${theme.accent(this.frames[this.currentFrame])} ${this.text}`);
    }, 80);
  }

  public update(text: string): void {
    this.text = text;
    if (!this.isInteractive) {
      console.log(`${theme.accent('•')} ${text}...`);
    }
  }

  public stop(successText?: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.isInteractive) {
      const msg = successText || this.text;
      process.stdout.write(`\r\x1B[K${theme.success('✔')} ${msg}\n\x1B[?25h`);
    } else if (successText) {
      console.log(`${theme.success('✔')} ${successText}`);
    }
  }

  public fail(errorText: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.isInteractive) {
      process.stdout.write(`\r\x1B[K${theme.error('✖')} ${errorText}\n\x1B[?25h`);
    } else {
      console.log(`${theme.error('✖')} ${errorText}`);
    }
  }
}
