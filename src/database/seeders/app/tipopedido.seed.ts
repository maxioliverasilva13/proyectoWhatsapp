import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { TipoPedido } from 'src/enums/tipopedido';

export const TIPO_SERVICIO_DELIVERY_ID = 1;
export const TIPO_SERVICIO_RESERVA_ID = 2;

export class TipoServicioSeed implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const tipoPedidoRepository = dataSource.getRepository(Tiposervicio);

    const defaultTipoPedidos = [
      {
        id: TIPO_SERVICIO_DELIVERY_ID,
        nombre: 'Delivery',
        tipo: TipoPedido.DELIVERY,
      },
      {
        id: TIPO_SERVICIO_RESERVA_ID,
        nombre: 'Reserva',
        tipo: TipoPedido.RESERVA,
      },
    ];

    const tipoPedExist = await tipoPedidoRepository.findOne({
      where: { id: TIPO_SERVICIO_DELIVERY_ID },
    });
    if (tipoPedExist && tipoPedExist?.id) {
      return;
    }

    await Promise.all(
      defaultTipoPedidos?.map(async (tipoPed) => {
        return await tipoPedidoRepository.upsert(tipoPed, ['id']);
      }),
    );
  }
}
