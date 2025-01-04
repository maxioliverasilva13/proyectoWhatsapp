import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import * as bcrypt from 'bcryptjs';

export class UserSeeder implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    const userRepository = dataSource.getRepository(Usuario);

    const password = await bcrypt.hash("abc123!", 10);

    const defaultUsers = [
      {
        nombre: 'Some',
        apellido: "User 1",
        correo: 'user1@gmail.com',
        password: password,
        id_rol: 1,
        id_empresa: 1,
      },
      {
        nombre: 'Some',
        apellido: "User 2",
        correo: 'user2@gmail.com',
        password: password,
        id_rol: 1,
        id_empresa: 1,
      },
      {
        nombre: 'Some User',
        apellido: "User 3",
        correo: 'user3@gmail.com',
        password: password,
        id_rol: 1,
        id_empresa: 1,
      },
    ];

    const userExists = await userRepository.findOne({ where: { id: 1 } });
    if (userExists && userExists?.id) {
      return;
    }
    await Promise.all(defaultUsers?.map(async (user) => {
      return await userRepository.upsert(user, ['id', 'correo']);
    }))
  }
}
