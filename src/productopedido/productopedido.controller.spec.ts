import { Test, TestingModule } from '@nestjs/testing';
import { ProductopedidoController } from './productopedido.controller';
import { ProductopedidoService } from './productopedido.service';

describe('ProductopedidoController', () => {
  let controller: ProductopedidoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductopedidoController],
      providers: [ProductopedidoService],
    }).compile();

    controller = module.get<ProductopedidoController>(ProductopedidoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
