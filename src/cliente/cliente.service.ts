import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { GetEmpresaDTO } from './dto/get-empresa-.dto';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ClienteService implements OnModuleDestroy {
  private usuarioRepository: Repository<Usuario>;
  private globalConnection: DataSource;


  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) { }

  async onModuleInit() {
    if (!this.globalConnection) {
      this.globalConnection = await handleGetGlobalConnection();
    }
    this.usuarioRepository = this.globalConnection.getRepository(Usuario);
  }

  async findByEmpresa(empresaId: number) {
    const clients = await this.clienteRepository.find({
      where: { empresa_id: empresaId },
    });
    return clients?.length;
  }

  async findUsersByEmpresa(empresaId: number) {
    const users = await this.usuarioRepository.find({
      where: { id_empresa: empresaId, activo: true },
    });
    return users.map((user) => {
      return {
        id: user?.id,
        nombre: user?.nombre,
        apellido: user?.apellido,
        image: user?.image,
      };
    });
  }

  async onModuleDestroy() {
    if (this.globalConnection && this.globalConnection.isInitialized) {
      await this.globalConnection.destroy();
    }
  }

  async createOrReturnExistClient(createClienteDto: CreateClienteDto) {
    try {
      const existClient = await this.clienteRepository.findOne({
        where: { telefono: createClienteDto.telefono, empresa_id: createClienteDto.empresaId },
      });

      if (existClient) {
        if (existClient?.nombre !== createClienteDto?.nombre) {
          existClient.nombre = createClienteDto.nombre;
          await this.clienteRepository.save(existClient);
        }

        return {
          statusCode: 200,
          ok: true,
          message: 'Cliente encontrado',
          clienteId: existClient.id,
          clientName: existClient.nombre,
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

    const clientes = await this.clienteRepository.find({
      where: whereCondition,
    });

    return clientes
  }

  async findWithOrders(data: { offset: number, limit: number, query?: string }) {
    const { offset, limit, query } = data;

    const whereClause = query
      ? { nombre: ILike(`%${query}%`) }
      : {};

    const [clientes, total] = await this.clienteRepository.findAndCount({
      where: whereClause,
      relations: ['pedido', 'pedido.pedidosprod'],
      skip: offset,
      take: limit,
      order: { nombre: 'ASC' },
    });

    const dataResponse = clientes.map((client) => {
      let totalMoney = 0;
      client.pedido.forEach((pedido) => {
        pedido.pedidosprod.forEach((element) => {
          totalMoney += element.cantidad * element.precio;
        });
      });

      return {
        ...client,
        totalGenerated: totalMoney,
      };
    });

    return {
      data: dataResponse,
      totalItems: total,
    };
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
