import { Controller, Post, Body } from '@nestjs/common';
import { OpenaiService } from './openAI.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('parse-menu')
  async parseMenu(@Body('text') text: string) {
    const data = await this.openaiService.parseMenu(text);
    return { products: data };
  }
}
