import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Roles } from 'src/guards/roles.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { TypeRol } from 'src/enums/rol';

@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
  // @Roles(TypeRol.SUPER_ADMIN)
  // @UseGuards(RolesGuard)
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresaService.create(createEmpresaDto);
  }

  @Post('/isGreenApiConfigured/:id')
  @Roles(TypeRol.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  isConfigured(@Param('id') id_empresa: number) {
    return this.empresaService.isGreenApiConfigured(id_empresa);
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

  @Get('/qr/:id')
  @Roles(TypeRol.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  getQr(@Param('id') id: number) {
    return this.empresaService.getQR(+id);
  }

  @Get('/authCode/:id/:numberPhone')
  @Roles(TypeRol.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  getAuthCode(
    @Param('id') id: number,
    @Param('numberPhone') numberPhone: number,
  ) {
    return this.empresaService.getAuthCode(+id, +numberPhone);
  }

  @Get('/info/getInfoByDomain')
  getInfoByDomain(@Query('domain') domain: string) {
    return this.empresaService.getInfoByDomain(domain);
  }
}
