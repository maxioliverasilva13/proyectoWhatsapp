import { Test, TestingModule } from '@nestjs/testing';
import { CambioestadopedidoService } from './cambioestadopedido.service';

describe('CambioestadopedidoService', () => {
  let service: CambioestadopedidoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CambioestadopedidoService],
    }).compile();

    service = module.get<CambioestadopedidoService>(CambioestadopedidoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
