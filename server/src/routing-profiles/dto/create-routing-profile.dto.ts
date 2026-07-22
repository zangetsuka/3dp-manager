import { IsString, IsOptional, IsEnum, IsObject, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoutingProfileType } from '../entities/routing-profile.entity';

export class CreateRoutingProfileDto {
  @ApiProperty({ description: 'Profile name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  @IsString()
  slug: string;

  @ApiProperty({ enum: RoutingProfileType })
  @IsEnum(RoutingProfileType)
  type: RoutingProfileType;

  @ApiPropertyOptional({ description: 'Source URL for remote profiles' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Routing config as JSON object' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
