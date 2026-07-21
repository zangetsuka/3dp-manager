import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly masterKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('MASTER_KEY');
    if (!key) {
      this.logger.warn(
        'MASTER_KEY is not set. Secrets will be stored in plain text. Set MASTER_KEY (32+ bytes) in environment.',
      );
      this.masterKey = null;
    } else {
      const raw = Buffer.from(key, 'utf8');
      this.masterKey = crypto.scryptSync(raw, '3dp-manager-salt', KEY_LENGTH);
    }
  }

  isEnabled(): boolean {
    return this.masterKey !== null;
  }

  encrypt(plaintext: string): string | null {
    if (!this.masterKey || !plaintext) return null;
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();
      const combined = Buffer.concat([iv, authTag, encrypted]);
      return combined.toString('base64');
    } catch (err) {
      this.logger.error(`Encryption failed: ${(err as Error).message}`);
      return null;
    }
  }

  decrypt(ciphertext: string | null | undefined): string | null {
    if (!this.masterKey || !ciphertext) return null;
    try {
      const combined = Buffer.from(ciphertext, 'base64');
      if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) return null;
      const iv = combined.subarray(0, IV_LENGTH);
      const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch (err) {
      this.logger.error(`Decryption failed: ${(err as Error).message}`);
      return null;
    }
  }
}
