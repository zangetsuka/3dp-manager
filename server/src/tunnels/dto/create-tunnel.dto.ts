import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTunnelDto {
  @ApiProperty({ description: 'Название туннеля', example: 'Relay DE' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'ID узла', example: 'uuid-node-id', required: false })
  @IsUUID()
  @IsOptional()
  nodeId?: string;

  @ApiProperty({ description: 'IP-адрес relay-сервера', example: '192.168.1.100' })
  @IsString()
  @MinLength(1)
  ip: string;

  @ApiProperty({ description: 'SSH порт', example: 22 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  sshPort: number;

  @ApiProperty({ description: 'Имя пользователя SSH', example: 'root' })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ description: 'Пароль SSH', example: 'password123', required: false })
  @ValidateIf((dto: CreateTunnelDto) => !dto.privateKey)
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Приватный ключ SSH', example: '-----BEGIN OPENSSH PRIVATE KEY-----...', required: false })
  @ValidateIf((dto: CreateTunnelDto) => !dto.password)
  @IsString()
  privateKey?: string;

  @ApiProperty({ description: 'Домен relay-сервера', example: 'relay.example.com', required: false })
  @IsString()
  @IsOptional()
  domain?: string;
}
