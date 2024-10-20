import { Test, TestingModule } from '@nestjs/testing';
import { MensajeService } from './mensaje.service';

describe('MensajeService', () => {
  let service: MensajeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MensajeService],
    }).compile();

    service = module.get<MensajeService>(MensajeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
