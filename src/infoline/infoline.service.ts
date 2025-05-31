import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { CreateInfolineDto } from './dto/create-infoline.dto';
import { UpdateInfolineDto } from './dto/update-infoline.dto';
import { DataSource, Repository } from 'typeorm';
import { Infoline } from './entities/infoline.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { TipoPedido } from 'src/enums/tipopedido';
import getCurrentDate from 'src/utils/getCurrentDate';
import { Empresa } from 'src/empresa/entities/empresa.entity';

@Injectable()
export class InfolineService implements OnModuleDestroy {
  private tipoServicioRepository: Repository<Tiposervicio>
  private globalConnection: DataSource;

  constructor(
    @InjectRepository(Infoline)
    private infoLineRepository: Repository<Infoline>,
  ) { }

  async onModuleInit() {
    if (!this.globalConnection) {
      this.globalConnection = await handleGetGlobalConnection();
    }
    this.tipoServicioRepository = this.globalConnection.getRepository(Tiposervicio);
  }

  async onModuleDestroy() {
    if (this.globalConnection && this.globalConnection.isInitialized) {
      await this.globalConnection.destroy();
    }
  }

  async create(createInfolineDto: CreateInfolineDto) {
    const idTipoServicio = createInfolineDto.id_tipo_servicio;
    const globalConnection = await handleGetGlobalConnection();
    const tipoServicioEntity = globalConnection.getRepository(Tiposervicio);
    const tipoServicioSelected = await tipoServicioEntity.find({
      where: { id: idTipoServicio },
    });
    const tipoServicioSelectedWithName = await tipoServicioEntity.findOne({
      where: { nombre: createInfolineDto.nombre },
    });
    try {
      if (tipoServicioSelected === null || tipoServicioSelectedWithName !== null) {
        throw new BadRequestException({
          ok: false,
          statusCode: 400,
          message: 'Invalid service type',
          error: 'Invalid service type',
        });
      };
      const resp = await this.infoLineRepository.save(createInfolineDto);
      return resp;
    } catch (error) {
      console.error(error);
    } finally {
      globalConnection.destroy();
    }
  }

  async findAll() {
    const globalConnection = await handleGetGlobalConnection();
    try {
      const empresaRepo = globalConnection.getRepository(Empresa);
      const empresa = await empresaRepo.findOne({ where: { db_name: process.env.SUBDOMAIN }, relations: ['tipoServicioId'] })
      console.log(empresa, empresa?.tipoServicioId?.id)
      return this.infoLineRepository.find({ where: { id_tipo_servicio: Number(empresa?.tipoServicioId?.id ?? 0) } });
    } catch (error) {
       throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
      });
    } finally {
      globalConnection.destroy();
    }
  }

  async findOne(id: number) {
    const item = await this.infoLineRepository.findOne({ where: { id: id } });
    return item;
  }

  async findAllFormatedText(empresaType: TipoPedido) {
    try {
      const tipoServicioExist = await this.tipoServicioRepository.findOne({ where: { tipo: empresaType } })

      if (!tipoServicioExist) {
        throw new BadRequestException('no existe el tipo de servicio proporcionado');
      }

      const allInfoLines = await this.infoLineRepository.find({ where: { id_tipo_servicio: tipoServicioExist.id } })
      let text = []

      allInfoLines.map((infoLine) => {
        text.push({
          nombre: infoLine.nombre,
          requerido: infoLine.requerido,
        })
      });
      return JSON.stringify(text);
    } catch (error) {
      console.log('error', error);
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
      });
    }
  }


  async remove(id: number) {
    try {
      const infoLine = await this.infoLineRepository.findOne({ where: { id: id } })
      if (!infoLine) {
        throw new BadRequestException({
          ok: false,
          statusCode: 400,
          message: 'Invalid service type',
          error: 'Invalid service type',
        });
      }
      if (infoLine.es_defecto === true) {
        if (!infoLine) {
          throw new BadRequestException({
            ok: false,
            statusCode: 400,
            message: "No puedes borrar un InfoLine pro defecto",
            error: 'No puedes borrar un InfoLine pro defecto',
          });
        }
      }
      await this.infoLineRepository.remove(infoLine);
      return true;
    } catch (error) {
      return false;
    }
  }
}
