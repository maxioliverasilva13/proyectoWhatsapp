import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Roles } from 'src/guards/roles.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { TypeRol } from 'src/enums/rol';
import { Request } from 'express';

@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
  @Roles(TypeRol.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresaService.create(createEmpresaDto);
  }

  @Get()
  @Roles(TypeRol.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.empresaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empresaService.findOne(+id);
  }

  @Patch(':id')
  @Roles(TypeRol.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto) {
    return this.empresaService.update(+id, updateEmpresaDto);
  }

  @Delete(':id')
  @Roles(TypeRol.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.empresaService.remove(+id);
  }

  @Get('configSuccessfully/:id')
  @Roles(TypeRol.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  configOk(@Param('id') id: number) {
    return this.empresaService.configured(id);
  }
}
