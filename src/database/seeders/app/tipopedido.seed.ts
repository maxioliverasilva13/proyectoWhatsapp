import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { TipoPedido } from 'src/enums/tipopedido';

export class TipoServicioSeed implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    const tipoPedidoRepository = dataSource.getRepository(Tiposervicio);

    const defaultTipoPedidos = [
      {
        id: 1,
        nombre: 'Delivery',
        tipo: TipoPedido.DELIVERY,
      },
      {
       id: 2,
       nombre: 'Reserva',
       tipo: TipoPedido.RESERVA,
      },
    ]

    const tipoPedExist = await tipoPedidoRepository.findOne({ where: { id: 1}});
    if (tipoPedExist && tipoPedExist?.id) {
      return;
    }

    await Promise.all(defaultTipoPedidos?.map(async (tipoPed) => {
      return await tipoPedidoRepository.upsert(tipoPed, ['id']);
    }))

  }
}
