import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialBaseTables1770000000002 implements MigrationInterface {
  name = 'InitialBaseTables1770000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "setting" (
        "key" character varying NOT NULL,
        "value" character varying NOT NULL,
        "description" character varying,
        CONSTRAINT "PK_setting_key" PRIMARY KEY ("key")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "domain" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "isEnabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_domain_name" UNIQUE ("name"),
        CONSTRAINT "PK_domain_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "uuid" character varying NOT NULL,
        "isEnabled" boolean NOT NULL DEFAULT true,
        "isAutoRotationEnabled" boolean NOT NULL DEFAULT true,
        "inboundsConfig" text,
        "nodeId" uuid,
        "relayServerId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscription_uuid" UNIQUE ("uuid"),
        CONSTRAINT "PK_subscription_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inbound" (
        "id" SERIAL NOT NULL,
        "xuiId" integer NOT NULL,
        "port" integer NOT NULL,
        "protocol" character varying NOT NULL,
        "remark" character varying,
        "link" text,
        "subscriptionId" integer,
        "nodeId" uuid,
        "relayServerId" integer,
        CONSTRAINT "PK_inbound_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tunnel" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "ip" character varying NOT NULL,
        "sshPort" integer NOT NULL DEFAULT 22,
        "username" character varying NOT NULL,
        "password" character varying,
        "privateKey" text,
        "domain" character varying,
        "nodeId" uuid,
        "ports" text,
        "isInstalled" boolean NOT NULL DEFAULT false,
        "hostKeyFingerprint" character varying,
        CONSTRAINT "PK_tunnel_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" SERIAL NOT NULL,
        "action" character varying NOT NULL,
        "entityType" character varying,
        "entityId" character varying,
        "detail" text,
        "ip" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_action" ON "audit_log" ("action")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job" (
        "id" SERIAL NOT NULL,
        "type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "progress" integer NOT NULL DEFAULT 0,
        "payload" text,
        "result" text,
        "error" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        CONSTRAINT "PK_job_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_job_type" ON "job" ("type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "job"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tunnel"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inbound"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "domain"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "setting"`);
  }
}
