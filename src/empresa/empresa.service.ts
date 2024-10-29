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

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
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
        const newEmpresaDb =
          await this.tenantService.createInfraEmpresa(dbName);
        if (newEmpresaDb) {
          const newEmpresa = new Empresa();
          newEmpresa.nombre = createEmpresaDto.nombre;
          newEmpresa.db_name = dbName;
          await this.empresaRepository.save(newEmpresa);

          return {
            ok: true,
            statusCode: 200,
            message: 'Empresa creada exitosamente',
          };
          
        } else {
          throw new Error('No se pudo crear la empresa');
        }
      } else {
        const dbName = getDbName(createEmpresaDto.nombre);
        const newEmpresa = new Empresa();
        newEmpresa.nombre = createEmpresaDto.nombre;
        newEmpresa.db_name = dbName;
        await this.empresaRepository.save(newEmpresa);
        return {
          ok: true,
          statusCode: 200,
          message: 'Empresa creada exitosamente',
        };
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
}
