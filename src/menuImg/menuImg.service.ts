import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuImage } from './entities/menu';
import Tesseract from 'tesseract.js';
import * as fs from 'fs';
import { OpenaiService } from 'src/openAI/openAI.service';

@Injectable()
export class MenuImageService {
  constructor(
    @InjectRepository(MenuImage)
    private readonly menuImageRepo: Repository<MenuImage>,
    private readonly openAiService: OpenaiService
  ) { }

  create(url: string): Promise<MenuImage> {
    const image = this.menuImageRepo.create({ url });
    return this.menuImageRepo.save(image);
  }

  findAll(): Promise<MenuImage[]> {
    return this.menuImageRepo.find();
  }

  async parseMenuFromImage(imagePath: string) {
    try {
      const ocrResult = await Tesseract.recognize(imagePath, 'spa');
      const extractedText = ocrResult.data.text;

      fs.unlink(imagePath, () => null);

      return await this.openAiService.parseMenu(extractedText);
    } catch (error) {
      throw new BadRequestException({
        message: 'Error procesando imagen',
        error: error.message,
      });
    }
  }

  findOne(id: number): Promise<MenuImage> {
    return this.menuImageRepo.findOne({ where: { id } });
  }

  async markAsProcessed(id: number): Promise<MenuImage> {
    const image = await this.findOne(id);
    image.processed = true;
    return this.menuImageRepo.save(image);
  }

  async delete(id: number): Promise<void> {
    await this.menuImageRepo.delete(id);
  }
}
