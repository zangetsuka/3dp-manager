import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { XuiService } from '../xui/xui.service';
import { AuditService } from '../audit/audit.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { v4 as uuidv4 } from 'uuid';
import { Node } from '../nodes/entities/node.entity';
import { Tunnel } from '../tunnels/entities/tunnel.entity';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerGroup } from '../customer-groups/entities/customer-group.entity';
import { RoutingProfile } from '../routing-profiles/entities/routing-profile.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subRepo: Repository<Subscription>,
    @InjectRepository(Node)
    private nodeRepo: Repository<Node>,
    @InjectRepository(Tunnel)
    private tunnelRepo: Repository<Tunnel>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(CustomerGroup)
    private groupRepo: Repository<CustomerGroup>,
    @InjectRepository(RoutingProfile)
    private routingProfileRepo: Repository<RoutingProfile>,
    private xuiService: XuiService,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.subRepo.find({
      relations: ['inbounds', 'node', 'relayServer'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateSubscriptionDto) {
    await this.validateInboundsConfig(dto.inboundsConfig);
    const sub = this.subRepo.create({
      name: dto.name,
      uuid: uuidv4(),
      inboundsConfig: dto.inboundsConfig || [],
      isAutoRotationEnabled: dto.isAutoRotationEnabled ?? true,
      node: await this.resolveNode(dto.nodeId),
      relayServer: await this.resolveRelay(dto.relayServerId),
      customer: dto.customerId ? await this.resolveCustomer(dto.customerId) : undefined,
      group: dto.groupId ? await this.resolveGroup(dto.groupId) : undefined,
      routingProfile: dto.routingProfileId ? await this.resolveRoutingProfile(dto.routingProfileId) : undefined,
      publicToken: dto.publicToken,
      trafficLimit: dto.trafficLimit,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    const saved = await this.subRepo.save(sub);
    await this.audit.log({ action: 'CREATE', entityType: 'subscription', entityId: saved.id, detail: `Created subscription: ${saved.name}` });
    return saved;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const sub = await this.subRepo.findOne({
      where: { id },
      relations: ['inbounds', 'node', 'relayServer'],
    });

    if (!sub) {
      return null;
    }

    // Пустое имя не обновляется — защита от случайной очистки
    if (dto.name && dto.name.trim().length > 0) {
      sub.name = dto.name;
    }

    if (dto.inboundsConfig) {
      await this.validateInboundsConfig(dto.inboundsConfig);
      sub.inboundsConfig = dto.inboundsConfig;
    }

    if (dto.isAutoRotationEnabled !== undefined) {
      sub.isAutoRotationEnabled = dto.isAutoRotationEnabled;
    }

    if ('nodeId' in dto) {
      sub.node = await this.resolveNode(dto.nodeId);
      sub.nodeId = dto.nodeId;
    }

    if ('relayServerId' in dto) {
      sub.relayServer = await this.resolveRelay(dto.relayServerId);
      sub.relayServerId = dto.relayServerId;
    }

    if ('customerId' in dto) {
      sub.customer = dto.customerId ? await this.resolveCustomer(dto.customerId) : null;
    }
    if ('groupId' in dto) {
      sub.group = dto.groupId ? await this.resolveGroup(dto.groupId) : null;
    }
    if ('routingProfileId' in dto) {
      sub.routingProfile = dto.routingProfileId ? await this.resolveRoutingProfile(dto.routingProfileId) : null;
    }
    if ('publicToken' in dto) sub.publicToken = dto.publicToken;
    if ('trafficLimit' in dto) sub.trafficLimit = dto.trafficLimit;
    if ('expiresAt' in dto) sub.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const saved = await this.subRepo.save(sub);
    await this.audit.log({ action: 'UPDATE', entityType: 'subscription', entityId: id, detail: `Updated subscription: ${saved.name}` });
    return saved;
  }

  async remove(id: string) {
    const sub = await this.subRepo.findOne({
      where: { id },
      relations: ['inbounds', 'inbounds.node'],
    });
    if (!sub) return;

    if (sub.inbounds && sub.inbounds.length > 0) {
      for (const inbound of sub.inbounds) {
        if (!inbound.xuiId || inbound.xuiId <= 0) continue;

        const isDeleted = await this.xuiService.deleteInbound(
          inbound.xuiId,
          await this.resolveInboundNode(inbound),
        );

        if (!isDeleted) {
          throw new BadRequestException(
            `Failed to delete inbound ${inbound.xuiId} from 3x-ui`,
          );
        }
      }
    }

    await this.subRepo.remove(sub);
    await this.audit.log({ action: 'DELETE', entityType: 'subscription', entityId: id, detail: `Deleted subscription: ${sub.name}` });
  }

  private async resolveNode(nodeId?: string | null) {
    if (!nodeId) return null;
    const node = await this.nodeRepo
      .createQueryBuilder('node')
      .addSelect('node.password')
      .addSelect('node.token')
      .where('node.id = :nodeId', { nodeId })
      .getOne();

    if (!node) {
      throw new BadRequestException('Node not found');
    }

    return node;
  }

  private async resolveInboundNode(inbound: Inbound) {
    if (!inbound.nodeId) return undefined;

    return (
      (await this.nodeRepo
        .createQueryBuilder('node')
        .addSelect('node.password')
        .addSelect('node.token')
        .where('node.id = :nodeId', { nodeId: inbound.nodeId })
        .getOne()) ?? inbound.node
    );
  }

  private async resolveCustomer(customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new BadRequestException('Customer not found');
    return customer;
  }

  private async resolveGroup(groupId: string) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new BadRequestException('Group not found');
    return group;
  }

  private async resolveRoutingProfile(routingProfileId: string) {
    const profile = await this.routingProfileRepo.findOne({ where: { id: routingProfileId } });
    if (!profile) throw new BadRequestException('Routing profile not found');
    return profile;
  }

  private async resolveRelay(relayServerId?: number | null) {
    if (!relayServerId) return null;
    const relay = await this.tunnelRepo.findOne({
      where: { id: relayServerId },
    });

    if (!relay) {
      throw new BadRequestException('Relay server not found');
    }

    return relay;
  }

  private async validateInboundsConfig(
    inboundsConfig?: CreateSubscriptionDto['inboundsConfig'],
  ) {
    for (const config of inboundsConfig || []) {
      if (config.type === 'custom') continue;

      if (config.nodeId) {
        const node = await this.nodeRepo.findOne({
          where: { id: config.nodeId },
        });
        if (!node) {
          throw new BadRequestException('Node not found');
        }
      }

      if (config.relayServerId) {
        const relay = await this.tunnelRepo.findOne({
          where: { id: config.relayServerId },
        });
        if (!relay) {
          throw new BadRequestException('Relay server not found');
        }

        if (config.nodeId && relay.nodeId && relay.nodeId !== config.nodeId) {
          throw new BadRequestException(
            'Relay server belongs to another node',
          );
        }
      }

      if (
        config.port === undefined ||
        config.port === null ||
        config.port === '' ||
        config.port === 'random'
      ) {
        continue;
      }

      const port =
        typeof config.port === 'number'
          ? config.port
          : /^\d+$/.test(config.port)
            ? Number(config.port)
            : NaN;

      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new BadRequestException(
          'Port must be "random" or an integer from 1 to 65535',
        );
      }
    }
  }
}
