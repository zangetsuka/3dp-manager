import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tunnel } from './entities/tunnel.entity';
import { SshService } from './ssh.service';
import { EncryptionService } from '../encryption/encryption.service';
import { AuditService } from '../audit/audit.service';
import { JobService } from '../jobs/job.service';
import { Setting } from '../settings/entities/setting.entity';
import { Node } from '../nodes/entities/node.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { CreateTunnelDto } from './dto/create-tunnel.dto';
import { FORWARDING_SCRIPTS } from './forwarding.constants';
import * as net from 'net';
import * as dns from 'dns/promises';
import * as crypto from 'crypto';

@Injectable()
export class TunnelsService {
  private readonly logger = new Logger(TunnelsService.name);

  constructor(
    @InjectRepository(Tunnel) private tunnelRepo: Repository<Tunnel>,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
    @InjectRepository(Node) private nodeRepo: Repository<Node>,
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    private sshService: SshService,
    private encryptionService: EncryptionService,
    private readonly audit: AuditService,
    private readonly jobService: JobService,
  ) {}

  async create(createTunnelDto: CreateTunnelDto) {
    const address = await this.resolveRelayAddress(createTunnelDto.ip);

    const node = createTunnelDto.nodeId
      ? await this.nodeRepo.findOne({ where: { id: createTunnelDto.nodeId } })
      : await this.nodeRepo.findOne({ where: { isMain: true } });

    if (!node) {
      throw new HttpException('Node not found', HttpStatus.BAD_REQUEST);
    }

    const tunnelPayload = {
      ...createTunnelDto,
      ip: address.ip,
      node,
      nodeId: node.id,
    };

    const domain = createTunnelDto.domain || address.domain;
    if (domain) {
      Object.assign(tunnelPayload, { domain });
    }

    const tunnel = this.tunnelRepo.create(tunnelPayload);
    if (tunnel.password) tunnel.password = this.encryptionService.encrypt(tunnel.password) ?? tunnel.password;
    if (tunnel.privateKey) tunnel.privateKey = this.encryptionService.encrypt(tunnel.privateKey) ?? tunnel.privateKey;
    const saved = await this.tunnelRepo.save(tunnel);
    await this.audit.log({ action: 'CREATE', entityType: 'tunnel', entityId: String(saved.id), detail: `Created tunnel to ${saved.ip}` });
    return saved;
  }

  async findAll() {
    return this.tunnelRepo.find({ relations: ['node'] });
  }

  async remove(id: number, deleteForwarding = false) {
    if (deleteForwarding) {
      await this.uninstallScript(id);
    }

    await this.cleanupRelayDependencies(id);
    await this.tunnelRepo.delete(id);
    await this.audit.log({ action: 'DELETE', entityType: 'tunnel', entityId: String(id), detail: `Deleted tunnel ${id}` });
  }

  private async cleanupRelayDependencies(id: number) {
    const subscriptions = await this.subscriptionRepo.find({
      where: [{ relayServerId: id }],
    });

    for (const sub of subscriptions) {
      sub.relayServerId = undefined;
      sub.relayServer = undefined;
      await this.subscriptionRepo.save(sub);
    }

    const configuredSubscriptions = await this.subscriptionRepo.find();
    for (const sub of configuredSubscriptions) {
      const config = sub.inboundsConfig || [];
      const nextConfig = config.map((item) => {
        if (item.relayServerId !== id) return item;
        const { relayServerId: _relayServerId, ...rest } = item;
        return rest;
      });

      if (JSON.stringify(nextConfig) !== JSON.stringify(config)) {
        sub.inboundsConfig = nextConfig;
        await this.subscriptionRepo.save(sub);
      }
    }
  }

  async installScript(id: number) {
    const job = await this.jobService.create('relay_install', { tunnelId: id });
    await this.jobService.start(job.id);

    try {
      const tunnel = await this.tunnelRepo
        .createQueryBuilder('tunnel')
        .addSelect('tunnel.password')
        .addSelect('tunnel.privateKey')
        .where('tunnel.id = :id', { id })
        .getOne();

      if (!tunnel) {
        await this.jobService.fail(job.id, 'Tunnel not found');
        throw new HttpException('Tunnel not found', HttpStatus.NOT_FOUND);
      }

      const targetNode = tunnel.nodeId
        ? await this.nodeRepo.findOne({ where: { id: tunnel.nodeId } })
        : await this.nodeRepo.findOne({ where: { isMain: true } });
      const hostSetting = await this.settingRepo.findOne({ where: { key: 'xui_ip' } });

      if (!targetNode && (!hostSetting || !hostSetting.value)) {
        await this.jobService.fail(job.id, 'Server IP not configured');
        throw new HttpException(
          'В настройках (Settings) не сохранен Host/IP основного сервера (xui_host). Сохраните настройки подключения к 3x-ui заново.',
          HttpStatus.BAD_REQUEST,
        );
      }
      const rawOriginIp =
        targetNode?.ip ||
        targetNode?.host ||
        this.getNodeAddress(targetNode) ||
        hostSetting?.value;

      if (!rawOriginIp || net.isIP(rawOriginIp) === 0) {
        await this.jobService.fail(job.id, `Invalid origin server IP: "${rawOriginIp}"`);
        throw new HttpException(
          `Invalid origin server IP: "${rawOriginIp}". ORIGIN_IP must be a valid IPv4 or IPv6 address.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const mainServerIp = rawOriginIp;

      tunnel.password = this.encryptionService.decrypt(tunnel.password) ?? tunnel.password;
      tunnel.privateKey = this.encryptionService.decrypt(tunnel.privateKey) ?? tunnel.privateKey;

      this.logger.debug(
        `Начинаем установку редиректа на ${tunnel.ip} -> ${mainServerIp}`,
      );

      const installScript = await this.fetchAndVerifyScript(FORWARDING_SCRIPTS.INSTALL);
      const installCommand = `sudo ORIGIN_IP="${mainServerIp}" bash -s <<'SCRIPT_EOF'
${installScript}
SCRIPT_EOF`;

      const output = await this.sshService.executeCommand(
        {
          host: tunnel.ip,
          port: tunnel.sshPort,
          username: tunnel.username,
          password: tunnel.password,
          privateKey: tunnel.privateKey,
          hostKeyFingerprint: tunnel.hostKeyFingerprint || undefined,
        },
        installCommand,
        180000,
      );

      this.logger.debug(`Скрипт выполнен успешно:\n${output}`);

      tunnel.isInstalled = true;
      await this.tunnelRepo.save(tunnel);
      await this.audit.log({ action: 'INSTALL_RELAY', entityType: 'tunnel', entityId: String(id), detail: `Installed relay on tunnel ${id}` });
      await this.jobService.complete(job.id, `Installed relay on tunnel ${id}`);

      return { success: true, output };
    } catch (e) {
      const error = e as Error;
      this.logger.error(`Ошибка SSH: ${error.message}`);
      await this.jobService.fail(job.id, error.message);
      throw new HttpException(
        `Ошибка установки: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uninstallScript(id: number) {
    const job = await this.jobService.create('relay_delete', { tunnelId: id });
    await this.jobService.start(job.id);

    try {
      const tunnel = await this.tunnelRepo
        .createQueryBuilder('tunnel')
        .addSelect('tunnel.password')
        .addSelect('tunnel.privateKey')
        .where('tunnel.id = :id', { id })
        .getOne();

      if (!tunnel) {
        await this.jobService.fail(job.id, 'Tunnel not found');
        throw new HttpException('Tunnel not found', HttpStatus.NOT_FOUND);
      }

      tunnel.password = this.encryptionService.decrypt(tunnel.password) ?? tunnel.password;
      tunnel.privateKey = this.encryptionService.decrypt(tunnel.privateKey) ?? tunnel.privateKey;

      const deleteScript = await this.fetchAndVerifyScript(FORWARDING_SCRIPTS.DELETE);
      const deleteCommand = `sudo bash -s <<'SCRIPT_EOF'
${deleteScript}
SCRIPT_EOF`;

      const output = await this.sshService.executeCommand(
        {
          host: tunnel.ip,
          port: tunnel.sshPort,
          username: tunnel.username,
          password: tunnel.password,
          privateKey: tunnel.privateKey,
          hostKeyFingerprint: tunnel.hostKeyFingerprint || undefined,
        },
        deleteCommand,
        180000,
      );

      tunnel.isInstalled = false;
      await this.tunnelRepo.save(tunnel);
      await this.audit.log({ action: 'DELETE_RELAY', entityType: 'tunnel', entityId: String(id), detail: `Deleted relay on tunnel ${id}` });
      await this.jobService.complete(job.id, `Deleted relay on tunnel ${id}`);
      return { success: true, output };
    } catch (e) {
      const error = e as Error;
      this.logger.error(`Forwarding delete error: ${error.message}`);
      await this.jobService.fail(job.id, error.message);
      throw new HttpException(
        `Forwarding delete failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async retryOperation(id: number) {
    const tunnel = await this.tunnelRepo.findOne({ where: { id } });
    if (!tunnel) {
      throw new HttpException('Tunnel not found', HttpStatus.NOT_FOUND);
    }
    if (tunnel.isInstalled) {
      return this.uninstallScript(id);
    } else {
      return this.installScript(id);
    }
  }

  private async fetchAndVerifyScript(
    script: { url: string; sha256: string },
  ): Promise<string> {
    const response = await fetch(script.url, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new HttpException(
        `Failed to download script from ${script.url}: ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    const content = await response.text();
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    if (hash !== script.sha256) {
      throw new HttpException(
        `Script SHA-256 mismatch: expected ${script.sha256}, got ${hash}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return content;
  }

  private getNodeAddress(node?: Node | null) {
    if (!node?.url) return undefined;

    try {
      return new URL(node.url).hostname;
    } catch {
      return node.url;
    }
  }

  private async resolveRelayAddress(value: string) {
    const address = value.trim();
    if (!address) {
      throw new HttpException(
        'Relay server address is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (net.isIP(address) !== 0) {
      this.assertPublicIp(address);
      return { ip: address, domain: undefined };
    }

    if (!this.isValidHostname(address)) {
      throw new HttpException(
        'Relay server address is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await dns.lookup(address);
      this.assertPublicIp(result.address);
      return { ip: result.address, domain: address };
    } catch {
      throw new HttpException(
        'Relay server domain cannot be resolved',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertPublicIp(ip: string) {
    if (this.isPrivateIp(ip)) {
      throw new HttpException(
        `Relay server address must be a public IP, got private/reserved: ${ip}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private isPrivateIp(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
      return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80');
    }
    const [o1, o2] = parts;
    if (o1 === 10) return true;
    if (o1 === 127) return true;
    if (o1 === 169 && o2 === 254) return true;
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    if (o1 === 192 && o2 === 168) return true;
    if (o1 === 0) return true;
    if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;
    if (o1 === 198 && o2 === 18) return true;
    if (o1 === 192 && o2 === 0 && parts[2] === 0) return true;
    if (o1 === 192 && o2 === 0 && parts[2] === 2) return true;
    if (o1 === 198 && o2 === 51 && parts[2] === 100) return true;
    if (o1 === 203 && o2 === 0 && parts[2] === 113) return true;
    if (o1 >= 224) return true;
    return false;
  }

  private isValidHostname(value: string) {
    if (value.length > 253) return false;
    return /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(
      value,
    );
  }
}
