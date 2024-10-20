import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TiposervicioService } from './tiposervicio.service';
import { CreateTiposervicioDto } from './dto/create-tiposervicio.dto';
import { UpdateTiposervicioDto } from './dto/update-tiposervicio.dto';

@Controller('tiposervicio')
export class TiposervicioController {
  constructor(private readonly tiposervicioService: TiposervicioService) {}

  @Post()
  create(@Body() createTiposervicioDto: CreateTiposervicioDto) {
    return this.tiposervicioService.create(createTiposervicioDto);
  }

  @Get()
  findAll() {
    return this.tiposervicioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposervicioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTiposervicioDto: UpdateTiposervicioDto) {
    return this.tiposervicioService.update(+id, updateTiposervicioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tiposervicioService.remove(+id);
  }
}
