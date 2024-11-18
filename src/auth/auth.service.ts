import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { RegisterDTO } from './dto/register.dto';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { Empresa } from 'src/empresa/entities/empresa.entity';

@Injectable()
export class AuthService {
    private empresaRepository : Repository<Empresa>

    async onModuleInit() {
      const globalConnection = await handleGetGlobalConnection();
      this.empresaRepository = globalConnection.getRepository(Empresa); 

    }

    constructor(
        private jwtService: JwtService,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
      ) {}
    
      async validateUser(correo: string, password: string): Promise<any> {
        const user = await this.usuarioRepository.findOne({ where: { correo } });
        if (user && (await bcrypt.compare(password, user.password))) {
          const { password, ...result } = user;
          return result;
        }
        return null;
      }
    
      async login(user: Usuario) {
        const payload = { userId: user?.id, empresaId: user?.id_empresa , correo: user.correo, sub: user.id };
        return {
          access_token: this.jwtService.sign(payload),
        };
      }

      async register(userData: RegisterDTO) {
        // TODO: check if empresa is valid

        // Chcek if rol is valid

        console.log(userData);
        
        // todo: user another DTO
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = this.usuarioRepository.create({
          ...userData,
          activo: true,
          password: hashedPassword,
        });
        // delete user.password;
        return this.usuarioRepository.save(user);
      }

      async currentUser(userId: any) {
        const globalConnection = await handleGetGlobalConnection();
        const userRepository = globalConnection.getRepository(Usuario); 

        const user = await userRepository.findOne({ where: { id: userId }});
        if (!user) {
          throw new HttpException("Invalid user", 400);
        }
        let apiUrl = "";
        if (user.id_empresa) {
          const empresa = await this.empresaRepository.findOne({ where: { id: user.id_empresa } });
          if (empresa) {
            apiUrl = `${process.env.ENV === "dev" ? "http" : "https"}://${process.env.VIRTUAL_HOST?.replace("app", empresa?.db_name)}`
          }
        }

        const newUser = { ...user }
        delete newUser.password;
        return {
          ...newUser,
          apiUrl: apiUrl,
        }
      }

      async resetPassword(userEmail: string) {
        const globalConnection = await handleGetGlobalConnection();
        const userRepository = globalConnection.getRepository(Usuario); 

        const user = await userRepository.findOne({ where: { correo: userEmail }});
        if (!user) {
          throw new HttpException("Invalid user", 400);
        }
        // send mail to reset password
        return {
          ok: true,
          message: "La password se restablecio correctamente, chequea el email",
        }
      }
}
