import { Test, TestingModule } from '@nestjs/testing';
import { TiposervicioController } from './tiposervicio.controller';
import { TiposervicioService } from './tiposervicio.service';

describe('TiposervicioController', () => {
  let controller: TiposervicioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposervicioController],
      providers: [TiposervicioService],
    }).compile();

    controller = module.get<TiposervicioController>(TiposervicioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
