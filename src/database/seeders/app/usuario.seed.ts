import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import * as bcrypt from 'bcryptjs';

export class UserSeeder implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    const userRepository = dataSource.getRepository(Usuario);

    const password = await bcrypt.hash("abc123!", 10);

    let defaultAdmin = await userRepository.findOne({ where: { id: 1 } });

    if (!defaultAdmin) {
      defaultAdmin = userRepository.create({
        id:1,
        nombre: 'Admin',
        apellido: 'Default',
        correo: 'admin@admin.com',
        password: password,
        id_rol: 2,
        id_empresa: 1,
      });
      await userRepository.save(defaultAdmin);
    }

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

    for (const user of defaultUsers) {
      const userExists = await userRepository.findOne({ where: { correo: user.correo } });

      if (!userExists) {
        await userRepository.save(user);
      }
    }
  }
}
