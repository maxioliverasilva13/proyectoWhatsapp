export class CreateEspacioDto {
  nombre: string;
  descripcion: string;
  capacidad: number;
  image: string;
  ubicacion: string;
  precios?: {
    tipo_intervalo: 'minutos' | 'horas' | 'dias';
    duracion_intervalo: number;
    precio: number;
  }[];
}