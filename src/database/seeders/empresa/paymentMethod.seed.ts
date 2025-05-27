import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Infoline } from 'src/infoline/entities/infoline.entity';
import {
    defaultsInfoLineDelivery,
    defaultsInfoLineReservas,
    NOMBRE_INFOLINE_DELIVERY,
} from 'src/utils/infoline';
import { defaultPaymentMethods, ID_PAYMENT_METHOD_TRANSFER } from 'src/utils/paymentMethod';
import { PaymentMethod } from 'src/paymentMethod/entities/paymentMethod.entity';

export class PaymentMethodSeed implements Seeder {
    async run(
        dataSource: DataSource,
        factoryManager: SeederFactoryManager,
    ): Promise<void> {
        const paymentMethodRepo = dataSource.getRepository(PaymentMethod);

        const exists = await paymentMethodRepo.findOne({
            where: { id: ID_PAYMENT_METHOD_TRANSFER },
        });
        if (exists && exists?.id) {
            return;
        }

        await Promise.all(
            defaultPaymentMethods?.map(async (paymentMethod) => {
                return await paymentMethodRepo.upsert(paymentMethod, ['id']);
            }),
        );
    }
}
