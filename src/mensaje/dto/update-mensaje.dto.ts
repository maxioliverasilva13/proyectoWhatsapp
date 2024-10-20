import { PartialType } from '@nestjs/mapped-types';
import { CreateMensajeDto } from './create-mensaje.dto';

export class UpdateMensajeDto extends PartialType(CreateMensajeDto) {}
