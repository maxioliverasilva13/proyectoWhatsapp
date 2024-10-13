import { IsEmail, IsNotEmpty, Matches } from "class-validator";

export class CreateUsuarioDto {
    @IsNotEmpty()
    nombre: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    /* La expresión regular determina una contraseña segura de 8 dígitos, 
    debe contener al menos un dígito o un carácter especial, al menos una letra mayúscula y una letra minúscula */
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: 'password too weak'})  
    password: string;
}
