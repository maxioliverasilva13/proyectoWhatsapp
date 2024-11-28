import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Infoline } from 'src/infoline/entities/infoline.entity';
import {
  defaultsInfoLineDelivery,
  defaultsInfoLineReservas,
  NOMBRE_INFOLINE_DELIVERY,
} from 'src/utils/infoline';

export class InfoLineSeed implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const infoLineRepository = dataSource.getRepository(Infoline);

    const exists = await infoLineRepository.findOne({
      where: { id: NOMBRE_INFOLINE_DELIVERY },
    });
    if (exists && exists?.id) {
      return;
    }

    await Promise.all(
      defaultsInfoLineDelivery?.map(async (infoline) => {
        return await infoLineRepository.upsert(infoline, ['id']);
      }),
    );
    await Promise.all(
      defaultsInfoLineReservas?.map(async (infoline) => {
        return await infoLineRepository.upsert(infoline, ['id']);
      }),
    );
  }
}
