import { Injectable, BadRequestException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Espacio } from './entities/espacio';
import { Producto } from 'src/producto/entities/producto.entity';
import { CreateEspacioDto } from './dto/create-espacio.dto';

@Injectable()
export class EspacioService {
  constructor(
    @InjectRepository(Espacio)
    private readonly espacioRepository: Repository<Espacio>,

    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) { }

  async findAll(): Promise<Espacio[]> {
    try {
      return await this.espacioRepository.find({ relations: ['producto'] });
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener los espacios',
        error: 'Bad Request',
      });
    }
  }

  async findOne(id: number): Promise<Espacio> {
    try {
      return await this.espacioRepository.findOneBy({ id });
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener el espacio',
        error: 'Bad Request',
      });
    }
  }

  async create(data: any) {
    try {
      const { products, ...rest } = data;

      const productos = await this.productoRepository.find({
        where: { id: In(products) },
      });

      const espacio = this.espacioRepository.create({
        ...rest,
      });

      return await this.espacioRepository.save(espacio);
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el espacio',
        error: 'Bad Request',
      });
    }
  }

  async update(id: number, data: any): Promise<Espacio> {
    try {
      const { products, ...rest } = data;

      const productos = await this.productoRepository.find({
        where: { id: In(products) },
      });

      await this.espacioRepository.update(id, {
        ...rest,
        producto: productos, 
      });

      return await this.findOne(id);
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al actualizar el espacio',
        error: 'Bad Request',
      });
    }
  }

  async findAllPlainText() {
    try {
      const espacios = await this.espacioRepository.find({ relations: ['producto'] });
      return espacios
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener los espacios en texto plano',
        error: 'Bad Request',
      });
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.espacioRepository.delete(id);
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al eliminar el espacio',
        error: 'Bad Request',
      });
    }
  }
}
