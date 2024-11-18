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
  ) {}

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
            id_rol: 1,
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

  update(id: number, updateEmpresaDto: UpdateEmpresaDto) {
    console.log('updateEmpresaDto', updateEmpresaDto);
    return `This action updates a #${id} empresa`;
  }

  remove(id: number) {
    return `This action removes a #${id} empresa`;
  }

  // @Interval(1000) 
  // mensjae() {
  //   console.log("hola");
  // }

  
}
