import {
  IsBoolean,
  IsEnum,
  IsIP,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { NodeAuthType } from '../entities/node.entity';

export class CreateNodeDto {
  @ApiProperty({ description: 'Название узла', example: 'Main Server' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'URL узла', example: 'https://panel.example.com' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'IP-адрес узла', example: '192.168.1.1', required: false })
  @IsIP()
  @IsOptional()
  ip?: string;

  @ApiProperty({ description: 'Домен узла', example: 'node.example.com', required: false })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({ description: 'Флаг страны', example: '🇩🇪', required: false })
  @IsString()
  @IsOptional()
  flag?: string;

  @ApiProperty({ description: 'Тип авторизации', enum: NodeAuthType, example: NodeAuthType.Password })
  @IsEnum(NodeAuthType)
  authType: NodeAuthType;

  @ApiProperty({ description: 'Логин для авторизации', example: 'admin', required: false })
  @ValidateIf((dto: CreateNodeDto) => dto.authType === NodeAuthType.Password)
  @IsString()
  login?: string;

  @ApiProperty({ description: 'Пароль для авторизации', example: 'password123', required: false })
  @ValidateIf((dto: CreateNodeDto) => dto.authType === NodeAuthType.Password)
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Токен для авторизации', example: 'token-abc-123', required: false })
  @ValidateIf((dto: CreateNodeDto) => dto.authType === NodeAuthType.Token)
  @IsString()
  token?: string;

  @ApiProperty({ description: 'Является главным узлом', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isMain?: boolean;

  @ApiProperty({ description: 'Версия узла', example: '1.0.0', required: false })
  @IsString()
  @IsOptional()
  version?: string;
}

export class UpdateNodeDto extends PartialType(CreateNodeDto) {}

export class NodeConnectionDto {
  @ApiProperty({ description: 'ID узла', example: 'uuid-connection-id' })
  @IsString()
  id: string;
}
