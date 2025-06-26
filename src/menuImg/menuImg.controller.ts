import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { MenuImageService } from './menuImg.service';

@Controller('menu-images')
export class MenuImageController {
  constructor(private readonly menuImageService: MenuImageService) {}

  @Post()
  create(@Body('url') url: string) {
    return this.menuImageService.create(url);
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
