import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InfolineService } from './infoline.service';
import { CreateInfolineDto } from './dto/create-infoline.dto';
import { TipoPedido } from 'src/enums/tipopedido';

@Controller('infoline')
export class InfolineController {
  constructor(private readonly infolineService: InfolineService) {}

  @Post()
  create(@Body() createInfolineDto: CreateInfolineDto) {
    return this.infolineService.create(createInfolineDto);
  }

  @Get()
  findAll() {
    return this.infolineService.findAll();
  }

  @Post('/fomatedText')
  findAllFormatedText(@Body() tipoServicioString : TipoPedido) {
    return this.infolineService.findAllFormatedText(tipoServicioString);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.infolineService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.infolineService.remove(+id);
  }
}
