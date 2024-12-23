import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

@Controller('pedido')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }

  @Get('/pending')
  findAllPending(@Req() request : Request) {
    const empresaType = request['empresaType']
    return this.pedidoService.findAllPedning(empresaType);
  }

  @Get('/finished')
  findAllFinish(@Req() request : Request) {
    const empresaType = request['empresaType']
    return this.pedidoService.findAllFinish(empresaType);
  }

  @Get('aviableDate')
  disponible(@Query('date') date: Date, @Body() producto : any ) {
    return this.pedidoService.consultarHorario(date,producto);
  }

  @Get('/confirm/:id')
  confirmOrder(@Param('id') id: number ) {
    return this.pedidoService.confirmOrder(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pedidoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePedidoDto: UpdatePedidoDto) {
    return this.pedidoService.update(+id, updatePedidoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pedidoService.remove(+id);
  }
}
