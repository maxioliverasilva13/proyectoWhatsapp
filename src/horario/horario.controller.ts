import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { HorarioService } from './horario.service';
import { CreateHorarioDto } from './dto/create-horario.dto';

@Controller('horario')
export class HorarioController {
  constructor(private readonly horarioService: HorarioService) {}

  @Post()
  create(@Body() dto: CreateHorarioDto) {
    return this.horarioService.create(dto);
  }

  @Post('/daily-menu')
  createDailyMenu(@Body() dto: CreateHorarioDto) {
    return this.horarioService.create(dto, true);
  }

  @Get()
  findAll() {
    return this.horarioService.findAll();
  }

  @Get('/daily-menu')
  findAllDailyMenu() {
    return this.horarioService.findAll(true);
  }

  @Put('/daily-menu/:id')
  updateDailyMenu(@Param('id') id: string, @Body() updatedailyData: any) {
    return this.horarioService.updateDailySchedule(id, updatedailyData);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.horarioService.remove(id);
  }
}
