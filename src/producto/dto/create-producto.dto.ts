export class CreateProductoDto {
  nombre: string;
  precio: number;
  descripcion: string;
  plazoDuracionEstimadoMinutos: number;
  disponible:boolean;
  isMenuDiario?: boolean;
  imagen: string;
  currency_id: number;
  diaSemana?: any;
  orderMenuDiario?: any;
  categoryIds: any[]
}
