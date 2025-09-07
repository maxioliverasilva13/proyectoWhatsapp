import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Precio } from 'src/espacio/entities/precio';
import { Espacio } from 'src/espacio/entities/espacio';

@Injectable()
export class PrecioService {
    constructor(
        @InjectRepository(Precio)
        private readonly precioRepo: Repository<Precio>,
        @InjectRepository(Espacio)
        private readonly espacioRepo: Repository<Espacio>,
    ) { }

    async findByEspacio(espacioId: number): Promise<Precio[]> {
        return this.precioRepo.find({
            where: { espacio: { id: espacioId } },
            relations: ['espacio'],
        });
    }

    async create(espacioId: number, data: Partial<Precio>): Promise<Precio> {
        const espacio = await this.espacioRepo.findOne({ where: { id: espacioId } });
        if (!espacio) throw new NotFoundException('Espacio no encontrado');

        const precio = this.precioRepo.create({ ...data, espacio });
        return this.precioRepo.save(precio);
    }

    async update(id: number, data: Partial<Precio>): Promise<Precio> {
        const precio = await this.precioRepo.findOne({ where: { id } });
        if (!precio) throw new NotFoundException('Precio no encontrado');

        Object.assign(precio, data);
        return this.precioRepo.save(precio);
    }

    async remove(id: number): Promise<void> {
        const precio = await this.precioRepo.findOne({ where: { id } });
        if (!precio) throw new NotFoundException('Precio no encontrado');

        await this.precioRepo.remove(precio);
    }
}
