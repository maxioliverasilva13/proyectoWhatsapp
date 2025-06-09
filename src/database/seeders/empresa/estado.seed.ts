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

    const estadoExiste = await estadoRepository.findOne({
      where: { nombre: EstadoDefecto.CREADO },
    });

    if (estadoExiste) return;

    const estados = [
      {
        id: EstadoDefectoIds.CREADO,
        nombre: EstadoDefecto.CREADO,
        es_defecto: true,
        order: 1,
      },
      {
        id: EstadoDefectoIds.PENDIENTE,
        nombre: EstadoDefecto.PENDIENTE,
        es_defecto: true,
        order: 2,
      },
      {
        id: EstadoDefectoIds.FINALIZADO,
        nombre: EstadoDefecto.FINALIZADO,
        es_defecto: true,
        finalizador: true,
        order: 3,
      },
      {
        id: EstadoDefectoIds.CANCELADO,
        nombre: EstadoDefecto.CANCELADO,
        finalizador: true,
        es_defecto: true,
        order: 4,
      },
    ];

    await estadoRepository.upsert(estados, ['id']);
  }
}
