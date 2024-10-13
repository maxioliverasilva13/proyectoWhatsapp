import { IsNotEmpty } from "class-validator";
import { Column } from "typeorm";

export class RegisterRequestDto {
    @Column()
    nombre: string;

    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;
}
  