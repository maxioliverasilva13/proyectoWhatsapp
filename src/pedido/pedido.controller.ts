import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, ParseEnumPipe } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

enum OrderStatus {
  ALL = 'all',
  PENDING = 'pending',
  FINISHED = 'finished',
}

@Controller('pedido')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }

  @Get('/:orderStatus')
  findAllFinish(
    @Param('orderStatus', new ParseEnumPipe(OrderStatus)) orderStatus: OrderStatus,
  ) {
    return this.pedidoService.findOrders(orderStatus);
  }
  
  @Get('/calendar/formatCalendar/:date')
  getOrdersForCalendar(@Param('date') date : string) {
    return this.pedidoService.getOrdersForCalendar(date);
  }

  @Get("/calendar/next-date-avaiable")
  getNextDateAvailable(@Req() request: Request) {
    const empresaId = request['empresaId'];

    return this.pedidoService.getNextDateTimeAvailable(empresaId);
  }

  @Post('/aviableDate')
  disponible(@Query('date') date: string, @Body() producto, @Req() request: Request) {
    const timeZone = request['timeZone'];
    const empresaId = request['empresaId']
    
    return this.pedidoService.consultarHorario(date,producto, timeZone, empresaId);
  }

  @Get('/confirm/:id')
  confirmOrder(@Param('id') id: number ) {
    return this.pedidoService.confirmOrder(id);
  }

  @Get('/details/:id')
  getDetailsOfOrder(@Param('id') id: number ) {
    return this.pedidoService.getDetailsOfOrder(id);
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
