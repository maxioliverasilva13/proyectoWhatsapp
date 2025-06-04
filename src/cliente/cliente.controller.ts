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
  constructor(private readonly clienteService: ClienteService) {}

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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clienteService.remove(+id);
  }
}
