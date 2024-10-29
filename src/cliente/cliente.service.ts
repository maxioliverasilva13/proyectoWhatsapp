import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { Repository } from 'typeorm';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';

@Injectable()
export class ClienteService {

  private clienteRepository: Repository<Cliente>;

  async onModuleInit() {
    const globalConnection = await handleGetGlobalConnection();
    this.clienteRepository = globalConnection.getRepository(Cliente); 
  }

  async createOrReturnExistClient(createClienteDto: CreateClienteDto) {
    try {
      const existClient = await this.clienteRepository.findOne({
        where: { telefono: createClienteDto.telefono },
      });

      if (existClient) {
        return {
          statusCode: 200,
          ok: true,
          message: 'Cliente encontrado',
          clienteId: existClient.id,
        };
      }

      const newCliente = new Cliente();
      newCliente.nombre = createClienteDto.nombre || 'test';
      newCliente.telefono = createClienteDto.telefono;
      newCliente.empresa_id = createClienteDto.empresaId || 1;

      await this.clienteRepository.save(newCliente); 

      return {
        statusCode: 200,
        ok: true,
        message: 'Cliente creado exitosamente',
        clienteId: newCliente.id,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  findAll() {
    return `This action returns all cliente`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cliente`;
  }

  update(id: number, updateClienteDto: UpdateClienteDto) {
    return `This action updates a #${id} cliente`;
  }

  remove(id: number) {
    return `This action removes a #${id} cliente`;
  }
}
