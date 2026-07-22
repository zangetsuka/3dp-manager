import { Injectable } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';

const CLIENT_NAMESPACE = '31fa6d0c-4ea0-5b67-9863-6d8a77760e96';

@Injectable()
export class ClientIdentityService {
  slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'client';
  }

  stableXuiClientId(input: {
    customerId: string;
    subscriptionId: string;
    nodeId?: string;
    protocol: string;
  }): string {
    return uuidv5(
      [input.customerId, input.subscriptionId, input.nodeId || 'default', input.protocol].join(':'),
      CLIENT_NAMESPACE,
    );
  }

  readableXuiEmail(input: {
    customerName: string;
    subscriptionName: string;
    nodeName?: string;
    protocol: string;
  }): string {
    const parts = [input.customerName, input.subscriptionName, input.nodeName || 'main', input.protocol].map(this.slugify);
    return parts.join('--').slice(0, 180);
  }

  readableInboundRemark(input: {
    customerName: string;
    subscriptionName: string;
    nodeName?: string;
    protocol: string;
  }): string {
    return [input.customerName, input.subscriptionName, input.nodeName || 'Main', input.protocol].join(' / ').slice(0, 180);
  }
}
