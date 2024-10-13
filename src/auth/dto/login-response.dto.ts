import { Usuario } from "src/usuario/entities/usuario.entity";

export class AuthResponseDto {
    user : { id: number, nombre: string,  email: string, created_at: Date};
    token: string;
}
  