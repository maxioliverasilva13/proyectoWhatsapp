import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  ParseEnumPipe,
} from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

enum OrderStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  FINISHED = 'finished',
}

@Controller('pedido')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) { }

  @Post()
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }


  @Get('/statistics')
  getStatistics(@Req() request: any) {
    const filterType = request.query['type'] as any;
    return this.pedidoService.getStatistics(filterType);
  }

  @Get('/orderPlanStatus')
  pedidosStatus() {
    return this.pedidoService.orderPlanStatus();
  }

  @Get('/:orderStatus')
  findAllFinish(
    @Param('orderStatus', new ParseEnumPipe(OrderStatus)) orderStatus: OrderStatus,
    @Query('offset') offset: number,
    @Query('limit') limit: number,
  ) {
    return this.pedidoService.findOrders(orderStatus, offset, limit);
  }

  @Get('/calendar/formatCalendar/:date')
  getOrdersForCalendar(@Param('date') date: string, @Req() request: Request) {
    const timeZone = request['timeZone'];
    return this.pedidoService.getOrdersForCalendar(date, timeZone);
  }

  @Get('/calendar/next-date-avaiable')
  getNextDateAvailable(@Req() request: Request) {
    const timeZone = request['timeZone'];

    return this.pedidoService.getNextDateTimeAvailable(timeZone);
  }

  @Get('/calendar/dates-avaiable')
  getDatesAvailable(@Req() request: any) {
    const fecha = request.query['fecha'];
    const withPast = request.query['withPast'];
    return this.pedidoService.obtenerDisponibilidadActivasByFecha(
      fecha,
      withPast === 'true',
    );
  }

  @Post('/aviableDate')
  disponible(
    @Query('date') date: string,
    @Body() producto,
    @Req() request: Request,
  ) {
    const timeZone = request['timeZone'];
    const empresaId = request['empresaId'];

    return this.pedidoService.consultarHorario(
      date,
      producto,
      timeZone,
      empresaId,
    );
  }

  @Get('/confirm/:id')
  confirmOrder(@Param('id') id: number) {
    return this.pedidoService.confirmOrder(id);
  }

  @Get('/details/:id')
  getDetailsOfOrder(@Param('id') id: number) {
    return this.pedidoService.getDetailsOfOrder(id);
  }

  @Get('/myOrders/:clientId')
  getMyOrders(@Param('clientId') id: number) {
    return this.pedidoService.getMyOrders(id);
  }

  @Get('/stats/ordersDay/:date')
  getOrdersDay(@Param('date') fecha: string, @Req() request: Request) {
    const timeZone = request['timeZone'];

    return this.pedidoService.getOrdersOfTheDay(fecha, timeZone);
  }

  @Get('/stats/salesForCategory/')
  getSalesForCategory() {
    return this.pedidoService.getSalesForCategory();
  }

  @Get('/stats/momeyInDay/:date')
  getMoneyOfTheDay(@Param('date') fecha: string, @Req() request: Request) {
    const timeZone = request['timeZone'];

    return this.pedidoService.getMoneyOfTheDay(fecha, timeZone);
  }

  @Get('/stats/lastThree')
  getLastThreeOrders() {
    return this.pedidoService.getLastThreeOrders();
  }

  @Get('/stats/lastTime')
  getOrdersOfTimePeriod() {
    return this.pedidoService.getOrdersOfTimePeriods();
  }

  @Get('/filter/searchWIthQuery')
  searchOrdersWithQuery(
    @Query('query') query : string
  ) {
    return this.pedidoService.filtertOrdersWithQuery(query);
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
  remove(@Param('id') id: string, @Body() body: any) {
    const text = body?.reason;
    return this.pedidoService.remove(+id, text);
  }
}
