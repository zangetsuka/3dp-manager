import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'ssh2';

@Injectable()
export class SshService {
  private readonly logger = new Logger(SshService.name);

  async executeCommand(
    config: {
      host: string;
      port: number;
      username: string;
      password?: string;
      privateKey?: string;
      hostKeyFingerprint?: string;
    },
    command: string,
    timeoutMs = 120000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let timer: NodeJS.Timeout | undefined;

      const finish = (callback: () => void) => {
        if (timer) clearTimeout(timer);
        conn.end();
        callback();
      };

      const connectConfig: Record<string, unknown> = {
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey,
        readyTimeout: 20000,
      };

      if (config.hostKeyFingerprint) {
        connectConfig.hostHash = 'sha256';
        connectConfig.hostVerifier = (keyHash: string) => {
          const match = keyHash === config.hostKeyFingerprint;
          if (!match) {
            this.logger.error(
              `SSH host key mismatch for ${config.host}:${config.port}. Got ${keyHash}, expected ${config.hostKeyFingerprint}`,
            );
          }
          return match;
        };
      } else {
        this.logger.warn(
          `No host key fingerprint for ${config.host}:${config.port}. Skipping host key verification.`,
        );
      }

      conn
        .on('ready', () => {
          this.logger.debug(`SSH Connection established to ${config.host}`);
          this.logger.debug(`Executing SSH command: ${command}`);

          timer = setTimeout(() => {
            finish(() => reject(new Error(`SSH command timeout after ${timeoutMs}ms`)));
          }, timeoutMs);

          conn.exec(command, (err, stream) => {
            if (err) {
              return finish(() => reject(err));
            }

            let output = '';

            stream
              .on('close', (code, _signal) => {
                this.logger.debug(`SSH Command finished with code ${code}`);
                finish(() => {
                  if (code === 0) resolve(output);
                  else reject(new Error(`Exit code ${code}. Output: ${output}`));
                });
              })
              .on('data', (data: Buffer) => {
                output += data.toString();
              })
              .stderr.on('data', (data: Buffer) => {
                output += data.toString();
              });
          });
        })
        .on('error', (err) => {
          this.logger.error(`SSH Error: ${err.message}`);
          if (timer) clearTimeout(timer);
          reject(err);
        })
        .connect(connectConfig);
    });
  }
}
