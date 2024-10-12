import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { TenantConnectionService } from 'src/tenant-connection-service/tenant-connection-service.service';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { BcryptService } from 'src/bcrypt/bcrypt.service';
import { JsonWebTokenService } from 'src/jwt/jwt.service';
import { AuthResponseDto } from './dto/login-response.dto';
import { RegisterRequestDto } from './dto/register-request.dto';

@Injectable()
export class AuthService{

    constructor(private tenantConnectionService: TenantConnectionService,
                private _bcriptService: BcryptService,
                private _jwtService: JsonWebTokenService
    ) {}

    private async generateToken(payload: any): Promise<string>{
        // Generacion de token con 1 día de validez
       const token = await this._jwtService._generateTokenWithValidity(payload ,'24h');
       return token;
    }

    private generateUserPayload(user:Usuario){
        return {
            id: user.id,  
            nombre: user.nombre, 
            email: user.email,
            created_at: user.created_at, 
        }
    }

    async login(empresaId:number, loginRequestDto: LoginRequestDto) : Promise<AuthResponseDto>{
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
        if(!await this._bcriptService.compare(password, user.password))
            throw new UnauthorizedException();

       // Generacion de token
       const userData = this.generateUserPayload(user);

       const token = await this.generateToken(userData);

       return {
         user : userData,
         token
       }
    }

    async register(empresaId: number, registerRequestDto: RegisterRequestDto) : Promise<AuthResponseDto>{
        // Se obtiene la conexion a  la base de la empresa.
        const connection = await this.tenantConnectionService.getConnectionByEmpresa(empresaId);

        // Se obtiene el objeto repositorio de la entity Usuario
        const userRepository = connection.getRepository(Usuario);
        
        const { nombre, email, password } = registerRequestDto;

        // Se valida si ya existe un usuario con ese email.
        if(await userRepository.findOne({where: { email: email}})){
            throw new BadRequestException("Email already use");
        }

        let newUser = new Usuario();
        newUser.nombre = nombre;
        newUser.email = email;
        newUser.password = await this._bcriptService.hashPassword(password);
    
        newUser = await userRepository.save(userRepository.create(newUser));

        const userData = this.generateUserPayload(newUser);

        const token = await this.generateToken(userData);

        return {
            user: userData,
            token
        }
    }
}
