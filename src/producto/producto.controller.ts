import { Controller, Get, Post, Body, Req, Put, Delete, Param, Query } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { Request } from 'express';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Controller('producto')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Get()
  findAll(@Req() request : Request) {
    return this.productoService.findAll();
  }

  @Get('findWithQuery')
  findWithQuery(@Query('query') query: string) {
    return this.productoService.findAllWithQuery({
      query: query,
    });
  }

  @Get(':id')
  findOne(@Param('id') id : number) {
    return this.productoService.findOne(id);
  }

  @Get("formatedText")
  findAllInText(@Req() request: Request) {
    return this.productoService.findAllInText();
  }

  @Post()
  create(
    @Req() request: Request,
    @Body() createProductoDto: CreateProductoDto,
  ) {
    const empresaId = request['empresaId'];
    return this.productoService.create(createProductoDto, empresaId);
  }

  @Put(':id')
  async updateProducto(@Param('id') id : number,@Body() UpdateProductoDto: UpdateProductoDto) {
    return this.productoService.updateProducto(id, UpdateProductoDto)
  } 

  @Delete(':id')
  async deleteProducto(@Param('id') id : number ) {
    return this.productoService.deleteProducto(id)
  } 
}
