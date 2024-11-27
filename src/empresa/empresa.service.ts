import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { getDbName } from 'src/utils/empresa';
import { TenantConnectionService } from 'src/tenant-connection-service/tenant-connection-service.service';
import * as process from 'process';
import { isValidTimeFormat } from 'src/utils/time';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import * as bcrypt from 'bcryptjs';
import { METHODS } from 'http';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(Tiposervicio)
    private tipoServicioRepository: Repository<Tiposervicio>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @Inject(forwardRef(() => TenantConnectionService))
    private tenantService: TenantConnectionService,
  ) { }

  async create(createEmpresaDto: CreateEmpresaDto) {
    // TODO: agregar libreria para validar DTO
    try {
      if (!createEmpresaDto.nombre) {
        throw new BadRequestException('Nombre invalido');
      }

      if (process.env.ENV !== 'dev') {
        const dbName = getDbName(createEmpresaDto.nombre);
        const empresaExistsWithThisDbName = await this.empresaRepository?.findOne({ where: { db_name: dbName } });
        if (empresaExistsWithThisDbName) {
          throw new Error("Ya existe una emrpesa con este nombre")
        }

        const newEmpresa = new Empresa();
        newEmpresa.nombre = createEmpresaDto.nombre;
        newEmpresa.db_name = dbName;

        if (!isValidTimeFormat(createEmpresaDto?.hora_apertura) || isValidTimeFormat(createEmpresaDto?.hora_cierre)) {
          throw new Error('Hora de apertur y cierre invalidos');
        }
        newEmpresa.hora_apertura = createEmpresaDto.hora_apertura;
        newEmpresa.hora_cierre = createEmpresaDto.hora_cierre
        newEmpresa.logo = createEmpresaDto.logo;
        newEmpresa.descripcion = createEmpresaDto.descripcion;
        newEmpresa.menu = createEmpresaDto.menu;

        const existsTipoServicio = await this.tipoServicioRepository.findOne({ where: { id: Number(createEmpresaDto?.tipoServicioId) } });
        if (!existsTipoServicio) {
          throw new Error('El tipo de servicio es invalido');
        }

        const userExistsWithThisEmail = await this.usuarioRepository.findOne({ where: { correo: createEmpresaDto?.userEmail } });
        if (!userExistsWithThisEmail) {
          throw new Error('Ya existe un usuario con el correo ingresado');
        }
        const empresaCreated = await this.empresaRepository.save(newEmpresa);
        const hashedPassword = await bcrypt.hash(createEmpresaDto?.password, 10);
        const user = this.usuarioRepository.create({
          activo: true,
          nombre: '',
          correo: createEmpresaDto?.userEmail,
          apellido: '',
          id_empresa: empresaCreated?.id,
          // admin empresa
          id_rol: 2,
          password: hashedPassword,
        });

        // send email

        return {
          ok: true,
          statusCode: 200,
          message: 'Empresa creada exitosamente',
        };
      } else {
        throw new Error('No se pudo crear la empresa');
      }
    } catch (error: any) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  async findOne(id: number): Promise<Empresa> {
    return this.empresaRepository.findOne({ where: { id } });
  }

  async findBySubdomain(subdomain: string): Promise<Empresa> {
    return this.empresaRepository.findOne({ where: { db_name: subdomain } });
  }

  findAll() {
    return `This action returns all empresa`;
  }

  async update(id: number, updateEmpresaDto: UpdateEmpresaDto) {
    try {
      // Buscar la empresa por ID
      const empresa = await this.empresaRepository.findOne({ where: { id } });
      if (!empresa) {
        throw new BadRequestException('La empresa no existe');
      }
  
      Object.keys(updateEmpresaDto).forEach((key) => {
        if (updateEmpresaDto[key] !== undefined) {
          if (key in empresa) {
            (empresa as any)[key] = updateEmpresaDto[key];
          } else {
            throw new BadRequestException(`El campo ${key} no es válido`);
          }
        }
      });
      
      await this.empresaRepository.save(empresa);
  
      return {
        ok: true,
        statusCode: 200,
        message: 'Empresa actualizada exitosamente',
        data: empresa,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  remove(id: number) {
    return `This action removes a #${id} empresa`;
  }

  async getAuthCode(id:number, phoneNumber : number) {
    try {
      const existEmpresa = await this.empresaRepository.findOne({ where: { id } });
      if (!existEmpresa) {
        throw new BadRequestException('La empresa no existe')
      }
      
      const authCode = await fetch(`https://7103.api.greenapi.com/waInstance${existEmpresa.greenApiInstance}/getAuthorizationCode/${existEmpresa.greenApiInstanceToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
        }),
      
      });

      const resAuth = await authCode.json()
      
      return {
        statusCode:200,
        ok: true,
        resAuth:resAuth
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  async getQR(id: number) {
    try {
      const existEmpresa = await this.empresaRepository.findOne({ where: { id } });
      if (!existEmpresa) {
        throw new BadRequestException('La empresa no existe')
      }
      const myQr = await fetch(`https://7103.api.greenapi.com/waInstance${existEmpresa.greenApiInstance}/qr/${existEmpresa.greenApiInstanceToken}`)      

      const res = await myQr.json();

      return {
        statusCode:200,
        ok: true,
        qr: res,
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  // @Interval(1000) 
  // mensjae() {
  //   console.log("hola");
  // }


}
