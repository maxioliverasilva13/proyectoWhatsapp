import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import * as bcrypt from 'bcryptjs';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { TipoPedido } from 'src/enums/tipopedido';
import { Role } from 'src/roles/entities/role.entity';
import { TypeRol } from 'src/enums/rol';
import { Empresa } from 'src/empresa/entities/empresa.entity';

export class EmpresaSeed implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const empresaRepository = dataSource.getRepository(Empresa);

    const defaultEmpresas = [
      {
        id: 1,
        nombre: 'works',
        db_name: 'works',
        greenApiInstance: process.env.ID_INSTANCE,
        greenApiInstanceToken: process.env.API_TOKEN_INSTANCE,
      },
    ];

    const empresaExists = await empresaRepository.findOne({ where: { id: 1 } });
    if (empresaExists && empresaExists?.id) {
      return;
    }

    await Promise.all(
      defaultEmpresas?.map(async (empresa) => {
        return await empresaRepository.upsert(empresa, ['id']);
      }),
    );
  }
}
