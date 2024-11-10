import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import * as bcrypt from 'bcryptjs';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { TipoPedido } from 'src/enums/tipopedido';
import { Role } from 'src/roles/entities/role.entity';
import { TypeRol } from 'src/enums/rol';

export class RoolSeed implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    const rolRepository = dataSource.getRepository(Role);

    const rolesDefault = [
      {
        id: 1,
        nombre: 'Admin_Empresa',
        tipo: TypeRol.ADMIN_EMPRESA,
      },
      {
       id: 2,
       nombre: 'Admin_Global',
       tipo: TypeRol.SUPER_ADMIN,
      },
    ]

    const rolExists = await rolRepository.findOne({ where: { id: 1}});
    if (rolExists && rolExists?.id) {
      return;
    }

    await Promise.all(rolesDefault?.map(async (role) => {
      return await rolRepository.upsert(role, ['id']);
    }))
  }
}
