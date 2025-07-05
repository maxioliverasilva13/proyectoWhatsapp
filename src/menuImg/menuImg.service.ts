import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuImage } from './entities/menu';
import { OpenaiService } from 'src/openAI/openAI.service';
import { GreenApiService } from 'src/greenApi/GreenApi.service';

@Injectable()
export class MenuImageService {

  constructor(
    @InjectRepository(MenuImage)
    private readonly menuImageRepo: Repository<MenuImage>,
    private readonly openAiService: OpenaiService,
    @Inject(forwardRef(() => GreenApiService))
    private readonly greenApiService: GreenApiService,
  ) { }

  create(url: string, nombre: string): Promise<MenuImage> {
    const image = this.menuImageRepo.create({ url, nombre });
    return this.menuImageRepo.save(image);
  }

  findAll(): Promise<MenuImage[]> {
    return this.menuImageRepo.find();
  }

  async parseMenuFromImage(fileUrl: any) {
    try {
      if (!fileUrl) {
        throw new BadRequestException('No se recibió ninguna imagen');
      }
      return await this.openAiService.parseMenu(fileUrl)

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

  async getCantidadImages() {
    return await this.menuImageRepo.count()
  }

  async listProductsImages(chatIdWhatsapp: string) {
    try {

      const menuImgs = await this.menuImageRepo.find()

      let messageToAssistant = '';

      if (menuImgs.length > 0 && chatIdWhatsapp) {
        messageToAssistant = "IMPORTANTE: Ya se envió una imagen del menú al usuario. No debes listar los productos. Solo pregúntale qué desea. Aun así, debes usar esta lista de productos para validar lo que el usuario solicite.";
        await Promise.all(menuImgs.map(element =>
          this.greenApiService.sendImageToChat(chatIdWhatsapp, element.url)
        ));
      }

      return "Imagenes enviadas al usuario exitosamente"

    } catch (error) {
      throw new BadRequestException("error")
    }
  }
}
