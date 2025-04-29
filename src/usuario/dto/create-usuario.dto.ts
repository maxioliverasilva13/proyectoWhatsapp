export class CreateUsuarioDto {
    nombre: string;
    apellido: string;
    correo: string;
    password: string;
    id_empresa: number;
    id_rol?: number;
    activo: boolean;
    image?: string;
}
