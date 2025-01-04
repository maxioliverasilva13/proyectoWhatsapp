import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>
  ) { }

  async create(createUsuarioDto: CreateUsuarioDto) {
    try {
      const existUser = await this.usuarioRepository.findOne({ where: { correo: createUsuarioDto.correo, id_empresa:createUsuarioDto.id_empresa } })

      if (existUser) {
        throw new BadRequestException('There is already a user with that email')
      }
      const hashedPassword = await bcrypt.hash(createUsuarioDto.password, 10);

      const user = new Usuario()
      user.nombre = createUsuarioDto.nombre
      user.apellido = createUsuarioDto.apellido
      user.correo = createUsuarioDto.correo
      user.password = hashedPassword
      user.id_empresa = createUsuarioDto.id_empresa
      user.id_rol = 1
      user.activo = true

      await this.usuarioRepository.save(user)

      return {
        ok: true,
        statusCode: 200,
        message: 'User created successfully',
        data : user
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el pedido',
        error: 'Bad Request',
      });
    }
  }

  async findAll(empresaId: number) {
    try {
      
      const allUsers = await this.usuarioRepository.find({
        where: {
          id_empresa: empresaId,
        },
        select: [
          "createdAt", "id", "nombre", "apellido", "correo", "id_empresa", "id_rol", "activo", "firstUser",
        ],
      });
  
      if (allUsers.length === 0) {
        return {
          ok: false,
          statusCode: 404,
          message: `No se encontraron usuarios para la empresa con ID ${empresaId}`,
        };
      }
  
      return {
        ok: true,
        statusCode: 200,
        data: allUsers,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al buscar los usuarios',
        error: 'Bad Request',
      });
    }
  }
  

  async findOne(id: number) {
    try {
      const user = await this.usuarioRepository.findOne({
        where: { id }, select: [
          "createdAt", "id", "nombre", "apellido", "correo", "id_empresa", "id_rol", "activo", "firstUser",
        ]
      })
      if (!user) {
        throw new BadRequestException('There is no user with that id.')
      }

      return {
        ok: true,
        statusCode: 200,
        data: user
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el pedido',
        error: 'Bad Request',
      });
    }
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.usuarioRepository.findOneBy({ id });

    if (!usuario) {
      throw new Error(`Usuario con ID ${id} no encontrado.`);
    }

    const usuarioActualizado = this.usuarioRepository.merge(usuario, updateUsuarioDto);

    return this.usuarioRepository.save(usuarioActualizado);
  }

  async remove(id: number) {
    try {
      const user = await this.usuarioRepository.findOne({ where: { id } })
      if (!user) {
        throw new BadRequestException('There is no user with that id.')
      }

      if (user.firstUser) {
        throw new BadRequestException('The default company user cannot be deleted')
      }

      await this.usuarioRepository.delete(user.id)

      return {
        ok: true,
        statusCode: 200,
        data: 'User deleted succesfully'
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el pedido',
        error: 'Bad Request',
      });
    }
  }
}
