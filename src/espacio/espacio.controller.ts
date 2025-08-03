import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { EspacioService } from './espacio.service';
import { Espacio } from './entities/espacio';

@Controller('espacios')
export class EspacioController {
  constructor(private readonly espacioService: EspacioService) {}

  @Get()
  findAll(): Promise<Espacio[]> {
    return this.espacioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Espacio> {
    return this.espacioService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Espacio>): Promise<Espacio> {
    return this.espacioService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Espacio>,
  ): Promise<Espacio> {
    return this.espacioService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.espacioService.remove(id);
  }
}


