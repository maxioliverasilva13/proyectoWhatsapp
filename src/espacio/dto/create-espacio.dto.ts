export class CreateEspacioDto {
  nombre: string;
  descripcion: string;
  capacidad: string;
  ubicacion: string;
  products: string[]; // IDs de productos
}