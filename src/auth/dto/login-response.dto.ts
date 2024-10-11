import { Usuario } from "src/usuario/entities/usuario.entity";

export class LoginResponseDto {
    user : Usuario;
    token: string;
}
  