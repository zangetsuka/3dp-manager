import { ConsoleLogger } from '@nestjs/common';

export class JsonLogger extends ConsoleLogger {
  private toJson(level: string, message: string, context?: string, trace?: string): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      trace,
    });
  }

  log(message: string, context?: string) {
    process.stdout.write(this.toJson('info', message, context) + '\n');
  }

  warn(message: string, context?: string) {
    process.stdout.write(this.toJson('warn', message, context) + '\n');
  }

  error(message: string, trace?: string, context?: string) {
    process.stderr.write(this.toJson('error', message, context, trace) + '\n');
  }

  debug(message: string, context?: string) {
    process.stdout.write(this.toJson('debug', message, context) + '\n');
  }

  verbose(message: string, context?: string) {
    process.stdout.write(this.toJson('verbose', message, context) + '\n');
  }
}
