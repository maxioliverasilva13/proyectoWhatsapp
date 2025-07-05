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
} from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Controller('cliente')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) { }

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.createOrReturnExistClient(createClienteDto);
  }

  @Get()
  findAll(
    @Query('query') query: string,
    @Query('empresaId') empresaId: string,
  ) {
    return this.clienteService.findAll({
      query: query,
      empresaId: empresaId,
    });
  }

  @Get('allWithOrders')
  findAllWithOrders(
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('query') query?: string,

  ) {
    return this.clienteService.findWithOrders({
      offset: offset ? parseInt(offset) : 0,
      limit: limit ? parseInt(limit) : 10,
      query: query ?? ""
    });
  }

  @Get('oneWithOrders')
  oneWithOrders(
    @Query('clientId') clientId?: number,

  ) {
    return this.clienteService.oneWithOrders({
      clientId: clientId
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clienteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clienteService.update(+id, updateClienteDto);
  }

  @Get(':id')
  findClientsByEmpresa(@Req() request: Request) {
    const empresaId = request['empresaId'];
    return this.clienteService.findByEmpresa(empresaId);
  }

  @Post('updateClientsNotifyMenu')
  updateClientsNotifyMenu(@Req() request: Request, @Body() data) {
    const empresaId = request['empresaId'];
    return this.clienteService.updateClientsNotificarMenu(empresaId, data);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clienteService.remove(+id);
  }
}
