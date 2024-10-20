import { Test, TestingModule } from '@nestjs/testing';
import { TiposervicioService } from './tiposervicio.service';

describe('TiposervicioService', () => {
  let service: TiposervicioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TiposervicioService],
    }).compile();

    service = module.get<TiposervicioService>(TiposervicioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
