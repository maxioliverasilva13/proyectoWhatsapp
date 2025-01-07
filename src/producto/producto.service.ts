import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Producto } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { GetProductsDTO } from './dto/get-product-search.dto';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(ProductoPedido)
    private productoPedidoRepository: Repository<ProductoPedido>,
  ) { }

  async create(
    createProduct: CreateProductoDto,
    empresaId: number,
  ) {
    try {
      const product = new Producto();
      product.nombre = createProduct.nombre;
      product.precio = createProduct.precio;
      product.empresa_id = empresaId;
      product.descripcion = createProduct.descripcion;
      product.plazoDuracionEstimadoMinutos = createProduct.plazoDuracionEstimadoMinutos;
      product.disponible = createProduct.disponible;
      const producto = this.productoRepository.create(product);
      await this.productoRepository.save(producto);

      return {
        ok: true,
        statusCode: 200,
        data: product
      }
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al encontrar el producto',
        error: 'Bad Request',
      });
    }
  }

  async findAll(): Promise<Producto[]> {
    return this.productoRepository.find();
  }

  async findAllWithQuery(data: GetProductsDTO): Promise<Producto[]> {
    const whereCondition: any = { disponible: true, };

    if (data.query) {
      whereCondition.nombre = ILike(`%${data.query}%`);
    }

    const products = await this.productoRepository.find({ where: whereCondition });

    return products;
  }

  async findOne(id: number) {
    try {
      const producto = await this.productoRepository.findOne({ where: { id: id } });
      if (!producto) {
        throw new BadRequestException('El producto no existe')
      }
      return {
        ok: true,
        statusCode: 200,
        data: producto
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al encontrar el producto',
        error: 'Bad Request',
      });
    }
  }

  async findAllInText() {
    const productsAll = await this.productoRepository.find({where: {disponible: true}});

    const productsFormated = productsAll.map((product) => {
      return `${product.id}-Procuto: ${product.nombre},Precio: ${product.precio}, Descripcion:${product.descripcion}$`;
    }).join(', ');

    return productsFormated;
  }

  async updateProducto(id: number, updateProductoDto: UpdateProductoDto) {

    console.log(id, updateProductoDto);

    try {
      const existProduct = await this.productoRepository.findOne({ where: { id: id } })

      if (!existProduct) {
        throw new BadRequestException('El producto no existe')
      }
      for (const dato in existProduct) {
        if (updateProductoDto.hasOwnProperty(dato)) {
          existProduct[dato] = updateProductoDto[dato];
        }
      }

      await this.productoRepository.save(existProduct)

      return {
        statusCode: 200,
        ok: true,
        message: 'Producto actualizado correctamente'
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al actualizar el pedido',
        error: 'Bad Request',
      });
    }
  }

  async deleteProducto(id: number) {
    try {
      const existProduct = await this.productoRepository.findOne({
        where: { id },
        relations: ['pedidosprod']
      });
      if (!existProduct) {
        throw new BadRequestException('El producto no existe');
      }

      if (existProduct.pedidosprod.length > 0) {
        await this.productoPedidoRepository.delete({ productoId: id });
      }

      await this.productoRepository.delete(id);

      return {
        statusCode: 200,
        ok: true,
        message: 'Producto eliminado correctamente',
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al eliminar el producto',
        error: 'Bad Request',
      });
    }
  }

}
