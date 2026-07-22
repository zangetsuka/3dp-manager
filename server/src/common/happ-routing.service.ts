import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export type HappRoutingConfig = Record<string, unknown>;

@Injectable()
export class HappRoutingService {
  validate(input: unknown): asserts input is HappRoutingConfig {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Routing profile must be a JSON object');
    }
    const config = input as Record<string, unknown>;
    if (typeof config.Name !== 'string' || config.Name.trim() === '') {
      throw new Error('Routing profile must contain Name');
    }
    for (const key of ['DirectSites', 'DirectIp', 'ProxySites', 'ProxyIp', 'BlockSites', 'BlockIp']) {
      if (key in config && !Array.isArray(config[key])) {
        throw new Error(`${key} must be an array`);
      }
    }
  }

  canonicalize(config: HappRoutingConfig): string {
    this.validate(config);
    return JSON.stringify(config);
  }

  toDeeplink(config: HappRoutingConfig): string {
    const json = this.canonicalize(config);
    return `happ://routing/onadd/${Buffer.from(json, 'utf8').toString('base64')}`;
  }

  checksum(config: HappRoutingConfig): string {
    return createHash('sha256').update(this.canonicalize(config)).digest('hex');
  }

  addToSubscriptionBody(links: string[], config?: HappRoutingConfig | null): string {
    const lines = links.filter(Boolean);
    if (config) lines.push(this.toDeeplink(config));
    return lines.join('\n');
  }
}
