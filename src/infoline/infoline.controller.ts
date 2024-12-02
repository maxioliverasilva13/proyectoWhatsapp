import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InfolineService } from './infoline.service';
import { CreateInfolineDto } from './dto/create-infoline.dto';

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

  @Get('/fomatedText')
  findAllFormatedText() {
    return this.infolineService.findAllFormatedText();
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
