import { Injectable, BadRequestException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Espacio } from './entities/espacio';
import { Producto } from 'src/producto/entities/producto.entity';
import { CreateEspacioDto } from './dto/create-espacio.dto';
import { CreateEmpresaDto } from 'src/empresa/dto/create-empresa.dto';

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
      return await this.espacioRepository.find({ relations: ['productos'] });
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
      return await this.espacioRepository.findOne({
        where: { id },
        relations: ['productos'],
      });
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener el espacio',
        error: 'Bad Request',
      });
    }
  }


  async create(data: CreateEspacioDto) {
    try {
      // Asegurar que products sea array

      const productos = await this.productoRepository.find({
        where: { id: In(data.products) },
      });

      const espacio = this.espacioRepository.create({
        nombre: data.nombre,
        image: data.image,
        capacidad: Number(data.capacidad),
        descripcion: data.descripcion,
        ubicacion: data.ubicacion,
        productos,
      });

      return await this.espacioRepository.save(espacio);
    } catch (error) {
      console.error('CREATE ERROR:', error);
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el espacio',
        error: 'Bad Request',
      });
    }
  }

  async update(id: number, data: CreateEspacioDto): Promise<Espacio> {
    try {
      const espacio = await this.espacioRepository.findOne({
        where: { id },
        relations: ['productos'],
      });

      if (!espacio) {
        throw new BadRequestException('Espacio no encontrado');
      }

      const productos = Array.isArray(data.products)
        ? await this.productoRepository.find({ where: { id: In(data.products) } })
        : [];

      espacio.nombre = data.nombre;
      espacio.image = data.image;
      espacio.capacidad = Number(data.capacidad);
      espacio.descripcion = data.descripcion;
      espacio.ubicacion = data.ubicacion;
      espacio.productos = productos;

      return await this.espacioRepository.save(espacio);
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
      const espacios = await this.espacioRepository.find({ relations: ['productos'] });
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
