import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { Category } from 'src/category/entities/category.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Cliente } from 'src/cliente/entities/cliente.entity';
import { faker } from '@faker-js/faker';
import * as moment from 'moment-timezone';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { Empresa } from 'src/empresa/entities/empresa.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Pedido) private pedidoRepo: Repository<Pedido>,
    @InjectRepository(Producto) private productoRepo: Repository<Producto>,
    @InjectRepository(ProductoPedido)
    private productoPedidoRepo: Repository<ProductoPedido>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Chat) private chatRepo: Repository<Chat>,
    @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>,
  ) {}

  async run() {
    if (process.env.SUBDOMAIN === 'works') {
      const globalConnection = await handleGetGlobalConnection();
      try {
        const empresaRepo = globalConnection.getRepository(Empresa);
        const empresas = await empresaRepo.find();
        const emrpesasId = empresas?.map((emp) => emp?.id);

        await this.seedCategorias();
        const productos = await this.seedProductos(emrpesasId);
        const clientes = await this.seedClientes(emrpesasId ?? []);
        const chat = await this.seedChat();
        await this.seedPedidos(productos, clientes, chat);
      } catch (error) {
        console.error(error);
      } finally {
        globalConnection.destroy();
      }
    }
  }

  async seedCategorias() {
    const categorias = Array.from({ length: 5 }).map((_, i) =>
      this.categoryRepo.create({
        name: `Categoria ${i + 1}`,
        description: faker.commerce.productDescription(),
        image: faker.image.url(),
        enabled: true,
      }),
    );
    await this.categoryRepo.save(categorias);
  }

  async seedProductos(empresa_id: number[]) {
    const categorias = await this.categoryRepo.find();
    const productos = Array.from({ length: 30 }).map(() => {
      const prod = this.productoRepo.create({
        nombre: faker.commerce.productName(),
        precio: Number(faker.commerce.price()),
        imagen: faker.image.url(),
        empresa_id: faker.helpers.arrayElement(empresa_id),
        descripcion: faker.commerce.productDescription(),
        plazoDuracionEstimadoMinutos: faker.helpers.arrayElement([
          30, 60, 90, 120,
        ]),
        disponible: true,
        currency_id: 1,
        category: faker.helpers.arrayElements(
          categorias,
          faker.number.int({ min: 1, max: 2 }),
        ),
      });
      return prod;
    });
    return await this.productoRepo.save(productos);
  }

  async seedClientes(empresasId: number[]) {
    const clientes = Array.from({ length: 10 }).map(() =>
      this.clienteRepo.create({
        empresa_id: faker.helpers.arrayElement(empresasId),
        nombre: faker.person.fullName(),
        telefono: faker.phone.number(),
      }),
    );
    return await this.clienteRepo.save(clientes);
  }

  async seedChat() {
    const chat = this.chatRepo.create({
      chatIdExternal: '59898719635@c.us',
    });
    return await this.chatRepo.save(chat);
  }

  async seedPedidos(productos: Producto[], clientes: Cliente[], chat: Chat) {
    const pedidos = [];

    const now = new Date();
    const start = moment().subtract(1, 'month').startOf('month');
    const end = moment().add(1, 'month').endOf('month');

    for (let i = 0; i < 1000; i++) {
      const cliente = faker.helpers.arrayElement(clientes);
      const random = faker.date.between({
        from: start.toDate(),
        to: end.toDate(),
      });
      let m = moment(random);

      const roundedMinutes = m.minutes() < 30 ? 0 : 30;
      m.minutes(roundedMinutes).seconds(0).milliseconds(0);

      const formatted = m.utc().format('YYYY-MM-DD HH:mm:ssZ');

      const pedido = this.pedidoRepo.create({
        confirmado: faker.datatype.boolean(),
        withIA: faker.datatype.boolean(),
        reclamo: faker.lorem.sentence(),
        detalle_pedido: faker.lorem.paragraph(),
        chatIdWhatsapp: chat.chatIdExternal,
        transferUrl: faker.image.url(),
        tipo_servicio_id: faker.number.int({ min: 1, max: 2 }),
        cliente_id: cliente.id,
        chat,
        available: true,
        notified: false,
        finalizado: faker.datatype.boolean(),
        infoLinesJson: JSON.stringify({
          Direccion: `${faker.location.direction()}`,
        }),
        client: cliente,
        fecha: formatted,
      });
      pedidos.push(pedido);
    }

    const pedidosSaved = await this.pedidoRepo.save(pedidos);

    const productoPedidos = pedidosSaved.flatMap((pedido) => {
      const productosRandom = faker.helpers.arrayElements(
        productos,
        faker.number.int({ min: 1, max: 3 }),
      );
      return productosRandom.map((prod) =>
        this.productoPedidoRepo.create({
          pedido,
          producto: prod,
          pedidoId: pedido.id,
          productoId: prod.id,
          cantidad: faker.number.int({ min: 1, max: 5 }),
          precio: prod.precio,
          detalle: faker.commerce.productDescription(),
        }),
      );
    });

    await this.productoPedidoRepo.save(productoPedidos);
  }
}
