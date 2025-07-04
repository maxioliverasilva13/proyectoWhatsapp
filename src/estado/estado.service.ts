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

      const existEstadoWithNumber = await this.estadoRepository.findOne({ where: { order: createEstadoDto.order } })

      if (existEstadoWithNumber) {
        throw new BadRequestException("This order number already exist")
      }

      const newEstado = await this.estadoRepository.create({
        nombre: createEstadoDto.nombre,
        finalizador: createEstadoDto.finalizador,
        order: createEstadoDto.order,
        es_defecto: createEstadoDto.es_defecto,
        mensaje: createEstadoDto.mensaje
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
      const allStatus = await this.estadoRepository.find({ order: { order: "ASC" } })

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

      const statusExist = await this.estadoRepository.findOne({ where: { id: id } })

      if (!statusExist) {
        throw new BadRequestException("There no are status with those id")
      }

      return {
        ok: true,
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
            .set({ order: () => 'order - 1' })
            .where('order > :oldOrder AND order <= :newOrder', { oldOrder, newOrder })
            .execute();
        } else {
          await queryRunner.manager
            .createQueryBuilder()
            .update(Estado)
            .set({ order: () => 'order + 1' })
            .where('order >= :newOrder AND order < :oldOrder', { newOrder, oldOrder })
            .execute();
        }
      }

      estado.order = newOrder;
      queryRunner.manager.merge(Estado, estado, updateEstadoDto);
      await queryRunner.manager.save(estado);

      await queryRunner.commitTransaction();
      return {
        ok: true,
        data: estado
      }

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
      const status = await this.estadoRepository.findOne({ where: { id } });

      if (!status) {
        throw new BadRequestException("No existe un estado con ese ID");
      }

      const { order, finalizador } = status;

      await this.estadoRepository.delete(id);

      if (finalizador) {
        const [candidate] = await this.estadoRepository.find({ order: { order: "DESC" }, take: 1 });

        if (candidate) {
          candidate.finalizador = true;
          await this.estadoRepository.save(candidate);
        }
      }

      if (order !== null) {
        const nextItems = await this.estadoRepository.find({
          where: { order: MoreThan(order) },
        });

        await Promise.all(
          nextItems.map((item) => {
            item.order -= 1;
            return this.estadoRepository.save(item);
          })
        );
      }

      return {
        ok: true,
        message: "Estado eliminado correctamente",
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error inesperado',
        error: 'Bad Request',
      });
    }
  }

}
