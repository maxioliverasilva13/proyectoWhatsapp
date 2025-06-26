import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuImage } from './entities/menu';

@Injectable()
export class MenuImageService {
  constructor(
    @InjectRepository(MenuImage)
    private readonly menuImageRepo: Repository<MenuImage>,
  ) {}

  create(url: string): Promise<MenuImage> {
    const image = this.menuImageRepo.create({ url });
    return this.menuImageRepo.save(image);
  }

  findAll(): Promise<MenuImage[]> {
    return this.menuImageRepo.find();
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
