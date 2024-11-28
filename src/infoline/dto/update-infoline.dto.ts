import { PartialType } from '@nestjs/mapped-types';
import { CreateInfolineDto } from './create-infoline.dto';

export class UpdateInfolineDto extends PartialType(CreateInfolineDto) {}
