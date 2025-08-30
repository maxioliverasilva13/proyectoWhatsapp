import { CreatePedidoDto } from "./create-pedido.dto";

export class CreatePedidoEspacioDto extends CreatePedidoDto {
  fecha_inicio: Date;
  fecha_fin: Date;
  cantidad_precios_reservados?: number;
  observaciones?: string;
  precio_id?: string;
}