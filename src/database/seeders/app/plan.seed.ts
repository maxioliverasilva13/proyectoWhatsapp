import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Plan } from 'src/plan/entities/plan.entity';

export class PlanSeed implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const planRepository = dataSource.getRepository(Plan);

    const plansDefault = [
      {
        id: 1,
        nombre: 'Plan Básico',
        active: true,
        product_sku: 'basicsubscriptionmeasy2025',
        costoUSD: 49,
        diasDuracion: 31,
        mostPoppular: false,
        adventages:
          'Mensajes ilimitados,Hasta 500 ordenes mensuales,Respuesta rapida,Cierre provisorio,Multiples cuentas',
        maxPedidos: 500,
        isWeb: false,
      },
      {
        id: 2,
        nombre: 'Plan Intermedio',
        active: true,
        product_sku: 'mediumsubscriptionmeasy2025',
        costoUSD: 119,
        diasDuracion: 31,
        mostPoppular: true,
        adventages:
          'Mensajes ilimitados,Hasta 1000 ordenes mensuales,Web Personalizada,Respuesta rápida prioritaria,Cierre provisorio,Multiples cuentas,Soporte preferencial',
        maxPedidos: 1000,
        isWeb: true,
      },
      {
        id: 3,
        nombre: 'Plan Pro',
        active: true,
        product_sku: 'prosubscriptionmeasy2025',
        costoUSD: 219,
        diasDuracion: 31,
        mostPoppular: false,
        adventages:
          'Mensajes ilimitados,Hasta 2000 ordenes mensuales,Soporte premium,Cierre automático,Multiples cuentas,Integraciones avanzadas,Estadísticas en tiempo real,Calendario, Web personalizada',
        maxPedidos: 2000,
        isWeb: true,
      },
    ];

    const planExist = await planRepository.findOne({ where: { id: 1 } });
    if (planExist && planExist?.id) {
      return;
    }

    await Promise.all(
      plansDefault?.map(async (role) => {
        return await planRepository.upsert(role, ['id']);
      }),
    );
  }
}
