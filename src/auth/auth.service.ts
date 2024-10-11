import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { TenantConnectionService } from 'src/tenant-connection-service/tenant-connection-service.service';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { BcryptService } from 'src/bcrypt/bcrypt.service';
import { JsonWebTokenService } from 'src/jwt/jwt.service';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {

    constructor(private tenantConnectionService: TenantConnectionService,
                private _bcriptService: BcryptService,
                private _jwtService: JsonWebTokenService
    ) {}

    async login(empresaId:number, loginRequestDto: LoginRequestDto) : Promise<LoginResponseDto>{
        // Se obtiene la conexion a  la base de la empresa.
        const connection = await this.tenantConnectionService.getConnectionByEmpresa(empresaId);

        // Se obtiene el objeto repositorio de la entity Usuario
        const userRepository = connection.getRepository(Usuario);

        const { email , password  } = loginRequestDto;

        const user = await userRepository.findOne({
            where: { email }
        })
        // Se checkea que exista un user con ese email.
        if(user == null)
            throw new UnauthorizedException();

        // Se compara la password en texto plano con la password cifrada en la base.
        if(!this._bcriptService.compare(password, user.password))
            throw new UnauthorizedException();

       // Generacion de token
       const token = await this._jwtService._generateTokenWithValidity(user ,'1d');
       
       return {
         user,
         token
       }
    }
}
