import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Espacio } from './entities/espacio';

@Injectable()
export class EspacioService {
  constructor(
    @InjectRepository(Espacio)
    private readonly espacioRepository: Repository<Espacio>,
  ) { }

  async findAll(): Promise<Espacio[]> {
    try {
      return await this.espacioRepository.find();
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

  async create(data: Partial<Espacio>): Promise<Espacio> {
    try {
      const espacio = this.espacioRepository.create(data);
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

  async update(id: number, data: Partial<Espacio>): Promise<Espacio> {
    try {
      await this.espacioRepository.update(id, data);
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

  async findAllPlainText(): Promise<string> {
    try {
      const espacios = await this.espacioRepository.find();
      return espacios
        .map(
          (espacio) =>
            `ID: ${espacio.id}, Nombre: ${espacio.nombre}, Descripción: ${espacio.descripcion}, Ubicación: ${espacio.ubicacion}, Capacidad: ${espacio.capacidad ?? 'N/A'}`
        )
        .join('\n');
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
