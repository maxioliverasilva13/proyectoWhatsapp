import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PrecioService } from './precio.service';
import { Precio } from 'src/espacio/entities/precio';

@Controller('espacios/precios')
export class PrecioController {
    constructor(private readonly precioService: PrecioService) { }

    @Get(':espacioId')
    async getPreciosByEspacio(@Param('espacioId') espacioId: number): Promise<Precio[]> {
        return this.precioService.findByEspacio(espacioId);
    }

    @Post(':espacioId')
    async create(
        @Param('espacioId') espacioId: number,
        @Body() data: Partial<Precio>,
    ): Promise<Precio> {
        return this.precioService.create(espacioId, data);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() data: Partial<Precio>): Promise<Precio> {
        return this.precioService.update(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: number): Promise<void> {
        return this.precioService.remove(id);
    }
}
