import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEstadoDto } from './dto/create-estado.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Estado } from './entities/estado.entity';

@Injectable()
export class EstadoService {

  constructor(
    @InjectRepository(Usuario)
    private userRepository: Repository<Usuario>,
    @InjectRepository(Estado)
    private estadoRepository: Repository<Estado>
  ) { }

  async create(createEstadoDto: CreateEstadoDto) {
    try {
      if (!createEstadoDto.nombre || !createEstadoDto.order) {
        throw new BadRequestException("Plese enter a valid data")
      }

      const newEstado = await this.estadoRepository.create({
        nombre: createEstadoDto.nombre,
        finalizador: createEstadoDto.finalizador,
        order: createEstadoDto.order,
        es_defecto: createEstadoDto.es_defecto,
        tipoServicioId: createEstadoDto.tipoServicioId
      })

      await this.estadoRepository.save(newEstado)

      return {
        ok: true,
        message: "Status created successfully",
        data: newEstado
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

  async findAll() {
    try {
      const allStatus = await this.estadoRepository.find({order: {order: "ASC"}})

      return {
        ok: true,
        data: allStatus
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

  async findOne(id: number) {
    try {

      const statusExist = await this.estadoRepository.findOne({where: {id: id}})

      if(!statusExist) {
        throw new BadRequestException("There no are status with those id")
      }

      return {
        ok:true,
        data: statusExist
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

  async update(id: number, updateEstadoDto: UpdateEstadoDto) {
    const queryRunner = this.estadoRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const estado = await queryRunner.manager.findOne(Estado, { where: { id } });
      if (!estado) throw new BadRequestException("No existe un estado con ese ID");
  
      const oldOrder = estado.order;
      const newOrder = updateEstadoDto.order;
  
      if (oldOrder !== newOrder) {
        if (oldOrder < newOrder) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Estado)
            .set({ order: () => 'order - 1' }) // Disminuimos el order en los elementos intermedios
            .where('order > :oldOrder AND order <= :newOrder', { oldOrder, newOrder })
            .execute();
        } else {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Estado)
            .set({ order: () => 'order + 1' }) // Aumentamos el order en los elementos intermedios
            .where('order >= :newOrder AND order < :oldOrder', { newOrder, oldOrder })
            .execute();
        }
      }
  
      estado.order = newOrder;
      queryRunner.manager.merge(Estado, estado, updateEstadoDto);
      await queryRunner.manager.save(estado);
  
      await queryRunner.commitTransaction();
      return estado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    try {
      
      const statusExist = await this.estadoRepository.findOne({where: {id: id}})

      if(!statusExist) {
        throw new BadRequestException("There no are status with those id")
      }

      let order = statusExist.order
      let isFinalizador = statusExist.finalizador


      await this.estadoRepository.delete(statusExist)

      if(isFinalizador) {
        const candidate = await this.estadoRepository.find( { order:{order: "DESC"}, take:1})
  
        if(candidate[0]) {
          candidate[0].finalizador = true;
  
          await this.estadoRepository.save(candidate[0])
        }
      }

      const nextItemsToThis = await this.estadoRepository.find({where: {id: MoreThan(order)}})

      await Promise.all(
        await nextItemsToThis.map(async (item) => {
          item.order -= 1
          await this.estadoRepository.save(item)
          return;
        })
      )

      return {
        ok:true,
        message: "Status deleted successfully"
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
}
