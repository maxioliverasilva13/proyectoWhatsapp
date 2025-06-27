import { Controller, Get, Post, Body, Param, Delete, Patch, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { MenuImageService } from './menuImg.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('menu-images')
export class MenuImageController {
  constructor(private readonly menuImageService: MenuImageService) { }

  @Post()
  create(@Body() data: {url: string, nombre: string;}, ) {
    return this.menuImageService.create(data.url, data.nombre);
  }

  @Post('parseMenuImage')
  async parseMenuImage(@Query('url') url : string) {
    return  this.menuImageService.parseMenuFromImage(url);
  }

  @Get()
  findAll() {
    return this.menuImageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuImageService.findOne(+id);
  }

  @Patch(':id/processed')
  markAsProcessed(@Param('id') id: string) {
    return this.menuImageService.markAsProcessed(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuImageService.delete(+id);
  }
}
