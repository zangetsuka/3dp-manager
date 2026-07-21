import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  ValidateIf,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const PORT_OR_RANDOM = 'portOrRandom';

function IsPortOrRandom(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: PORT_OR_RANDOM,
      validator: {
        validate: (value: unknown) => {
          if (value === undefined || value === null || value === '') {
            return true;
          }
          if (value === 'random') return true;
          const port =
            typeof value === 'number'
              ? value
              : typeof value === 'string' && /^\d+$/.test(value)
                ? Number(value)
                : NaN;
          return Number.isInteger(port) && port >= 1 && port <= 65535;
        },
        defaultMessage: () =>
          'port must be "random" or an integer from 1 to 65535',
      },
    },
    validationOptions,
  );
}

export class InboundConfigDto {
  @ApiProperty({ description: 'Тип протокола', example: 'vless' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Порт или "random"', example: 443, required: false })
  @IsOptional()
  @IsPortOrRandom()
  port?: number | string;

  @ApiProperty({ description: 'SNI (Server Name Indication)', example: 'example.com', required: false })
  @IsString()
  @IsOptional()
  sni?: string;

  @ApiProperty({ description: 'Ссылка на inbound', example: 'vless://...', required: false })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiProperty({ description: 'ID узла', example: 'uuid-node-id', required: false })
  @IsUUID()
  @IsOptional()
  nodeId?: string;

  @ApiProperty({ description: 'ID relay-сервера', example: 1, required: false })
  @ValidateIf((dto: InboundConfigDto) => dto.relayServerId !== undefined)
  @Type(() => Number)
  @IsInt()
  relayServerId?: number;

  @ApiProperty({ description: 'Флаг страны', example: '🇩🇪', required: false })
  @IsString()
  @IsOptional()
  flag?: string;

  @ApiProperty({ description: 'Название inbound', example: 'VLESS-TLS', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Файл сертификата', example: '/etc/ssl/cert.pem', required: false })
  @IsString()
  @IsOptional()
  certificateFile?: string;

  @ApiProperty({ description: 'Файл ключа', example: '/etc/ssl/key.pem', required: false })
  @IsString()
  @IsOptional()
  keyFile?: string;

  // ⬇️ НОВОЕ ПОЛЕ ДЛЯ HAPP ROUTING ⬇️
  @IsString()
  @IsOptional()
  routingProfile?: string;
}

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Название подписки', example: 'My VPN Subscription' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Конфигурация inbound-ов', type: [InboundConfigDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InboundConfigDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsOptional()
  inboundsConfig?: InboundConfigDto[];

  @ApiProperty({ description: 'Автоматическая ротация', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isAutoRotationEnabled?: boolean;

  @ApiProperty({ description: 'ID узла', example: 'uuid-node-id', required: false })
  @IsUUID()
  @IsOptional()
  nodeId?: string;

  @ApiProperty({ description: 'ID relay-сервера', example: 1, required: false })
  @ValidateIf((dto: CreateSubscriptionDto) => dto.relayServerId !== undefined)
  @Type(() => Number)
  @IsInt()
  relayServerId?: number;
}
