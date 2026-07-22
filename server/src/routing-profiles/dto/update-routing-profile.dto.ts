import { PartialType } from '@nestjs/mapped-types';
import { CreateRoutingProfileDto } from './create-routing-profile.dto';

export class UpdateRoutingProfileDto extends PartialType(CreateRoutingProfileDto) {}
