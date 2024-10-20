import { Test, TestingModule } from '@nestjs/testing';
import { MensajeController } from './mensaje.controller';
import { MensajeService } from './mensaje.service';

describe('MensajeController', () => {
  let controller: MensajeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MensajeController],
      providers: [MensajeService],
    }).compile();

    controller = module.get<MensajeController>(MensajeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
