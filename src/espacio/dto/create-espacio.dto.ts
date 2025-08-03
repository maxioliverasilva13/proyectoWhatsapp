export class CreateEspacioDto {
  nombre: string;
  descripcion: string;
  capacidad: number;
  image: string;
  ubicacion: string;
  products: string[]; // IDs de productos
}