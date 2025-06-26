import { Controller, Get, Post, Body, Param, Delete, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MenuImageService } from './menuImg.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('menu-images')
export class MenuImageController {
  constructor(private readonly menuImageService: MenuImageService) {}

  @Post()
  create(@Body('url') url: string) {
    return this.menuImageService.create(url);
  }

  @Post('parseMenuImage')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async parseMenuFromImage(@UploadedFile() file: Express.Multer.File) {
    return this.menuImageService.parseMenuFromImage(file.path);
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
