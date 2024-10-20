import { PartialType } from '@nestjs/mapped-types';
import { CreateCambioestadopedidoDto } from './create-cambioestadopedido.dto';

export class UpdateCambioestadopedidoDto extends PartialType(CreateCambioestadopedidoDto) {}
