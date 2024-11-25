import { Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository : Repository<Usuario>
  ){}

  create(createUsuarioDto: CreateUsuarioDto) {
    return 'This action adds a new usuario';
  }

  findAll() {
    return `This action returns all usuario`;
  }

  findOne(id: number) {
    return `This action returns a #${id} usuario`;
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.usuarioRepository.findOneBy({ id });
  
    if (!usuario) {
      throw new Error(`Usuario con ID ${id} no encontrado.`);
    }
  
    const usuarioActualizado = this.usuarioRepository.merge(usuario, updateUsuarioDto);
  
    return this.usuarioRepository.save(usuarioActualizado);
  }

  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }
}
