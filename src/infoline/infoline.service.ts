import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateInfolineDto } from './dto/create-infoline.dto';
import { UpdateInfolineDto } from './dto/update-infoline.dto';
import { Repository } from 'typeorm';
import { Infoline } from './entities/infoline.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';

@Injectable()
export class InfolineService {
  constructor(
    @InjectRepository(Infoline)
    private infoLineRepository: Repository<Infoline>,
  ) {}

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
  }

  findAll() {
    return this.infoLineRepository.find();
  }

  async findOne(id: number) {
    const item = await this.infoLineRepository.findOne({ where: { id: id } });
    return item;
  }

  async findAllFormatedText () {
    try {
      const allInfoLines = await this.infoLineRepository.find()
      let text = ""

      allInfoLines.map((infoLine)=> {
        text += `\n${infoLine.nombre}`
      })
      return text
    } catch (error) {
      console.log('error', error);
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
