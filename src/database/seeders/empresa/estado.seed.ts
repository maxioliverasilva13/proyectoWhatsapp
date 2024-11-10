import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { EstadoDefecto } from 'src/enums/estadoDefecto';
import { Estado } from 'src/estado/entities/estado.entity';

export class RoolSeed implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const estadoRepository = dataSource.getRepository(Estado);

    await Promise.all(
      [1, 2].map(async (itm) => {

        const estados = [
          {
            id: 1,
            nombre: EstadoDefecto.CREADO,
            es_defecto: true,
            tipoServicioId: itm,
          },
          {
            id: 2,
            nombre: EstadoDefecto.PENDIENTE,
            tipoServicioId: itm,
            es_defecto: true,
          },
          {
            id: 3,
            nombre: EstadoDefecto.FINALIZADO,
            tipoServicioId: itm,
            es_defecto: true,
          },
        ];

        const estadoExists = await estadoRepository.findOne({ where: { id: 1}});
        if (estadoExists && estadoExists?.id) {
          return;
        }

        return await Promise.all(estados.map(async (user) => {
            const promise = await estadoRepository.upsert(user, ['id']);
            return promise;
        }))
      }),
    );
  }
}
