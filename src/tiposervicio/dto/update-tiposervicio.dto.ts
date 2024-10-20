import { PartialType } from '@nestjs/mapped-types';
import { CreateTiposervicioDto } from './create-tiposervicio.dto';

export class UpdateTiposervicioDto extends PartialType(CreateTiposervicioDto) {}
