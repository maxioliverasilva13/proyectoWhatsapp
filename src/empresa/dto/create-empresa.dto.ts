export class CreateEmpresaDto {
  nombre: string; // texto
  descripcion?: string; // texto
  logo?: string; // imagen
  menu?: string; // imagen
  notificarReservaHoras?: boolean; // check (boolean)
  tipoServicioId: string; //dropdown
  userEmail: string; // text
  password: string; // text
  direction? : string;
  timeZone?: string;
}
