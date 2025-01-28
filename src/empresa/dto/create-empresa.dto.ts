export class CreateEmpresaDto {
  nombre: string; // texto
  descripcion?: string; // texto
  logo?: string; // imagen
  menu?: string; // imagen
  hora_cierre?: string; // hroa
  hora_apertura?: string; // hora
  notificarReservaHoras?: boolean; // check (boolean)
  tipoServicioId: string; //dropdown
  userEmail: string; // text
  password: string; // text
  direction? : string;
  timeZone?: string;
}
