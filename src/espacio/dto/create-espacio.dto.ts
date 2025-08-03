export class CreateEspacioDto {
  nombre: string;
  descripcion: string;
  capacidad: string;
  image: string;
  ubicacion: string;
  products: string[]; // IDs de productos
}