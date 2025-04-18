import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { GetEmpresaDTO } from './dto/get-empresa-.dto';

@Injectable()
export class ClienteService implements OnModuleDestroy {

  private clienteRepository: Repository<Cliente>;
  private globalConnection: DataSource;

  async onModuleInit() {
    if (!this.globalConnection) {
      this.globalConnection = await handleGetGlobalConnection();
    }
    this.clienteRepository = this.globalConnection.getRepository(Cliente); 
  }

  async onModuleDestroy() {
    if (this.globalConnection && this.globalConnection.isInitialized) {
      await this.globalConnection.destroy();
    }
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
          clientName: existClient.nombre
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

  async findAll(data: GetEmpresaDTO) {
    const { empresaId, query } = data;

    const whereCondition: any = { empresa_id: empresaId };
    if (query) {
      whereCondition.nombre = ILike(`%${query}%`);
    }

    const clientes = await this.clienteRepository.find({ where: whereCondition });
    return clientes;
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
