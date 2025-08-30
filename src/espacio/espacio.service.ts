import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Espacio } from './entities/espacio';
import { CreateEspacioDto } from './dto/create-espacio.dto';
import { Precio } from './entities/precio';

@Injectable()
export class EspacioService {
  constructor(
    @InjectRepository(Espacio)
    private readonly espacioRepository: Repository<Espacio>,

    @InjectRepository(Precio)
    private readonly precioRepository: Repository<Precio>,
  ) { }

  async findAll(): Promise<Espacio[]> {
    try {
      return await this.espacioRepository.find({ relations: ['precios'] });
    } catch (error) {
      throw new BadRequestException('Error al obtener los espacios');
    }
  }

  async findOne(id: number): Promise<Espacio> {
    try {
      return await this.espacioRepository.findOne({
        where: { id },
        relations: ['precios'],
      });
    } catch (error) {
      throw new BadRequestException('Error al obtener el espacio');
    }
  }

  async findAllPlainText(): Promise<Espacio[]> {
    try {
      return await this.espacioRepository.find({
        relations: ['precios'],
      });
    } catch (error) {
      throw new BadRequestException('Error al obtener el espacio');
    }
  }

  async create(data: CreateEspacioDto) {
    try {
      const espacio = this.espacioRepository.create({
        nombre: data.nombre,
        image: data.image,
        capacidad: Number(data.capacidad),
        descripcion: data.descripcion,
        ubicacion: data.ubicacion,
        precios: data.precios?.map((p) =>
          this.precioRepository.create({
            tipo_intervalo: p.tipo_intervalo,
            duracion_intervalo: p.duracion_intervalo,
            precio: p.precio,
          }),
        ),
      });

      return await this.espacioRepository.save(espacio);
    } catch (error) {
      console.error('CREATE ERROR:', error);
      throw new BadRequestException('Error al crear el espacio');
    }
  }

  async update(id: number, data: CreateEspacioDto): Promise<Espacio> {
    try {
      const espacio = await this.espacioRepository.findOne({
        where: { id },
        relations: ['precios'],
      });

      if (!espacio) throw new BadRequestException('Espacio no encontrado');

      espacio.nombre = data.nombre;
      espacio.image = data.image;
      espacio.capacidad = Number(data.capacidad);
      espacio.descripcion = data.descripcion;
      espacio.ubicacion = data.ubicacion;

      // si vienen precios, reemplazamos
      if (data.precios) {
        await this.precioRepository.delete({ espacio: { id } });
        espacio.precios = data.precios.map((p) =>
          this.precioRepository.create({
            tipo_intervalo: p.tipo_intervalo,
            duracion_intervalo: p.duracion_intervalo,
            precio: p.precio,
          }),
        );
      }

      return await this.espacioRepository.save(espacio);
    } catch (error) {
      throw new BadRequestException('Error al actualizar el espacio');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.espacioRepository.delete(id);
    } catch (error) {
      throw new BadRequestException('Error al eliminar el espacio');
    }
  }
}
