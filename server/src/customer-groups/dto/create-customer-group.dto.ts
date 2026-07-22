import { IsString, IsOptional, IsBoolean, IsInt, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerGroupDto {
  @ApiProperty({ description: 'Group name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultRoutingProfileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  defaultTrafficLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  defaultExpiryDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  defaultAutoRotation?: boolean;
}
