import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { Request } from 'express';

@Controller('producto')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  create(
    @Req() request: Request,
    @Body() createProductoDto: CreateProductoDto,
  ) {
    const empresaId = request['empresaId'];
    return this.productoService.create(createProductoDto, empresaId);
  }

  @Get()
  findAll(@Req() request: Request) {
    const empresaId = request['empresaId'];
    return this.productoService.findAll(empresaId);
  }
}
