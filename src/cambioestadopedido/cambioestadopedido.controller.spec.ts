import { Test, TestingModule } from '@nestjs/testing';
import { CambioestadopedidoController } from './cambioestadopedido.controller';
import { CambioestadopedidoService } from './cambioestadopedido.service';

describe('CambioestadopedidoController', () => {
  let controller: CambioestadopedidoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CambioestadopedidoController],
      providers: [CambioestadopedidoService],
    }).compile();

    controller = module.get<CambioestadopedidoController>(CambioestadopedidoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
