import { Test, TestingModule } from '@nestjs/testing';
import { ProductopedidoService } from './productopedido.service';

describe('ProductopedidoService', () => {
  let service: ProductopedidoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductopedidoService],
    }).compile();

    service = module.get<ProductopedidoService>(ProductopedidoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
