export class CreateProductoDto {
  nombre: string;
  precio: number;
  descripcion: string;
  plazoDuracionEstimadoMinutos: number;
  disponible:boolean;
  imagen: string;
  currency_id: number;
  categoryIds: any[]
}
