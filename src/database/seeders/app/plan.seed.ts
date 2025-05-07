import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import * as bcrypt from 'bcryptjs';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { TipoPedido } from 'src/enums/tipopedido';
import { Role } from 'src/roles/entities/role.entity';
import { TypeRol } from 'src/enums/rol';
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
        nombre: 'Basic Plan',
        active: true,
        product_sku: 'basicsubscriptionmeasy2025',
        costoUSD: 99,
        diasDuracion: 31,
        mostPoppular: false,
        adventages:
          'Mensajes ilimitados,Hasta 300 ordenes mensuales,Respuesta rapida,Cierre provisorio,Multiples cuentas,Calendario',
        maxPedidos: 300,
      },
      {
        id: 2,
        nombre: 'Intermediate Plan',
        active: true,
        product_sku: 'mediumsubscriptionmeasy2025',
        costoUSD: 199,
        diasDuracion: 31,
        mostPoppular: true,
        adventages:
          'Mensajes ilimitados,Hasta 800 ordenes mensuales,Respuesta rápida prioritaria,Cierre provisorio,Multiples cuentas,Calendario,Soporte preferencial',
        maxPedidos: 800,
      },
      {
        id: 3,
        nombre: 'Pro Plan',
        active: true,
        product_sku: 'prosubscriptionmeasy2025',
        costoUSD: 349,
        diasDuracion: 31,
        mostPoppular: false,
        adventages:
          'Mensajes ilimitados,Hasta 2000 ordenes mensuales,Soporte premium,Cierre automático,Multiples cuentas,Integraciones avanzadas,Estadísticas en tiempo real,Calendario',
        maxPedidos: 2000,
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
