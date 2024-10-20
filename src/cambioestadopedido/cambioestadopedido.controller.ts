import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CambioestadopedidoService } from './cambioestadopedido.service';
import { CreateCambioestadopedidoDto } from './dto/create-cambioestadopedido.dto';
import { UpdateCambioestadopedidoDto } from './dto/update-cambioestadopedido.dto';

@Controller('cambioestadopedido')
export class CambioestadopedidoController {
  constructor(private readonly cambioestadopedidoService: CambioestadopedidoService) {}

  @Post()
  create(@Body() createCambioestadopedidoDto: CreateCambioestadopedidoDto) {
    return this.cambioestadopedidoService.create(createCambioestadopedidoDto);
  }

  @Get()
  findAll() {
    return this.cambioestadopedidoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cambioestadopedidoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCambioestadopedidoDto: UpdateCambioestadopedidoDto) {
    return this.cambioestadopedidoService.update(+id, updateCambioestadopedidoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cambioestadopedidoService.remove(+id);
  }
}
