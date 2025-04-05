import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { EstadoDefecto, EstadoDefectoIds } from 'src/enums/estadoDefecto';
import { Estado } from 'src/estado/entities/estado.entity';

export class EstadoSeed implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const estadoRepository = dataSource.getRepository(Estado);

    await Promise.all(
      [1, 2].map(async (itm) => {

        const estados = [
          {
            id: EstadoDefectoIds.CREADO,
            nombre: EstadoDefecto.CREADO,
            es_defecto: true,
            tipoServicioId: itm,
          },
          {
            id: EstadoDefectoIds.PENDIENTE,
            nombre: EstadoDefecto.PENDIENTE,
            tipoServicioId: itm,
            es_defecto: true,
          },
          {
            id: EstadoDefectoIds.FINALIZADO,
            nombre: EstadoDefecto.FINALIZADO,
            tipoServicioId: itm,
            es_defecto: true,
          },
          {
            id: EstadoDefectoIds.CANCELADO,
            nombre: EstadoDefecto.CANCELADO,
            tipoServicioId: itm,
            es_defecto: true,
          },
        ];

        const estadoExists = await estadoRepository.findOne({ where: { nombre: EstadoDefecto.CREADO }});
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
