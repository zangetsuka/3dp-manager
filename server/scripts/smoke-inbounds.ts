import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../src/app.module';
import { InboundBuilderService, ClientIdentity } from '../src/inbounds/inbound-builder.service';
import { XuiInboundRaw } from '../src/inbounds/xui-inbound.types';
import { Node } from '../src/nodes/entities/node.entity';
import { XuiService } from '../src/xui/xui.service';

const SNI = process.env.SMOKE_SNI || 'www.cloudflare.com';

type SmokeResult = {
  type: string;
  port: number;
  success: boolean;
  xuiId?: number | null;
  deleted?: boolean;
  error?: string;
};

const randomPort = () => Math.floor(Math.random() * (60000 - 20000 + 1)) + 20000;

function makeIdentity(protocol: string): ClientIdentity {
  const id = uuidv4();
  return {
    clientId: id,
    clientEmail: `smoke--${protocol}--${Date.now()}@test`,
    subId: uuidv4(),
  };
}

async function main() {
  console.log('Starting inbound smoke test...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  console.log('Application context is ready.');

  const nodeRepo = app.get<Repository<Node>>(getRepositoryToken(Node));
  const xuiService = app.get(XuiService);
  const builder = app.get(InboundBuilderService);

  const node = await nodeRepo
    .createQueryBuilder('node')
    .addSelect('node.password')
    .addSelect('node.token')
    .where('node.isMain = :isMain', { isMain: true })
    .getOne();

  if (!node) {
    throw new Error('Main node not found');
  }
  console.log(`Main node loaded: ${node.name}`);

  const keys = await xuiService.getNewX25519Cert(node);
  if (!keys) {
    throw new Error('Could not get Reality keys from the main node');
  }
  console.log('Reality keys received.');

  const buildCases: Array<{
    type: string;
    build: (port: number) => XuiInboundRaw;
  }> = [
    {
      type: 'vless-tcp-reality',
      build: (port) => builder.buildVlessRealityTcp({ port, sni: SNI, ...keys, identity: makeIdentity('vless') }),
    },
    {
      type: 'vless-xhttp-reality',
      build: (port) => builder.buildVlessRealityXhttp({ port, sni: SNI, ...keys, identity: makeIdentity('vless') }),
    },
    {
      type: 'vless-grpc-reality',
      build: (port) => builder.buildVlessRealityGrpc({ port, sni: SNI, ...keys, identity: makeIdentity('vless') }),
    },
    {
      type: 'vless-ws',
      build: (port) => builder.buildVlessWs({ port, sni: SNI, identity: makeIdentity('vless') }),
    },
    {
      type: 'vmess-tcp',
      build: (port) => builder.buildVmessTcp({ port, identity: makeIdentity('vmess') }),
    },
    {
      type: 'shadowsocks-tcp',
      build: (port) => builder.buildShadowsocksTcp({ port, identity: makeIdentity('ss') }),
    },
    {
      type: 'trojan-tcp-reality',
      build: (port) => builder.buildTrojanRealityTcp({ port, sni: SNI, ...keys, identity: makeIdentity('trojan') }),
    },
    {
      type: 'hysteria2-udp',
      build: (port) => builder.buildHysteria2Inbound({ port, sni: SNI, identity: makeIdentity('hy2') }),
    },
  ];

  const results: SmokeResult[] = [];

  for (const testCase of buildCases) {
    const port = randomPort();
    let xuiId: number | null = null;

    try {
      console.log(`Testing ${testCase.type} on port ${port}...`);
      const config = testCase.build(port);
      config.remark = `smoke-${testCase.type}-${Date.now()}`;
      xuiId = await xuiService.addInbound(config, node);

      if (xuiId) {
        console.log(`${testCase.type}: created with xuiId=${xuiId}; deleting...`);
        await xuiService.deleteInbound(xuiId, node);
      }

      results.push({
        type: testCase.type,
        port,
        success: Boolean(xuiId),
        xuiId,
        deleted: Boolean(xuiId),
      });
      console.log(`${testCase.type}: ${xuiId ? 'ok' : 'failed'}`);
    } catch (error) {
      if (xuiId) {
        await xuiService.deleteInbound(xuiId, node);
      }
      results.push({
        type: testCase.type,
        port,
        success: false,
        xuiId,
        deleted: Boolean(xuiId),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.table(results);
  await app.close();

  const failed = results.filter((result) => !result.success);
  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
