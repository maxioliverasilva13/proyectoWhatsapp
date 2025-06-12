export class UpdatePricesDto {
  tipoActualizacion: 'porcentaje' | 'monto';
  valor: number
  categoriaId?: number;
  soloDisponibles?: boolean;
}
