import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { Producto } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { DataSource, ILike, In, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { GetProductsDTO } from './dto/get-product-search.dto';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { Currency } from 'src/currencies/entities/currency.entity';
import { Category } from 'src/category/entities/category.entity';
import { UpdatePricesDto } from './dto/update-price-product.dto';
import { MenuImage } from 'src/menuImg/entities/menu';
import { GreenApiService } from 'src/greenApi/GreenApi.service';

@Injectable()
export class ProductoService implements OnModuleDestroy {
  private currencyRepo: Repository<Currency>;
  private globalConnection: DataSource;

  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(ProductoPedido)
    private productoPedidoRepository: Repository<ProductoPedido>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(MenuImage)
    private menuImgRepo: Repository<MenuImage>,
    @Inject(forwardRef(() => GreenApiService))
    private readonly greenApiService: GreenApiService,
  ) { }

  async onModuleInit() {
    if (!this.globalConnection) {
      this.globalConnection = await handleGetGlobalConnection();
    }
    this.currencyRepo = this.globalConnection.getRepository(Currency);
  }

  async onModuleDestroy() {
    if (this.globalConnection && this.globalConnection.isInitialized) {
      await this.globalConnection.destroy();
    }
  }

  async getCurrencies() {
    const currencies = await this.currencyRepo.find();
    return JSON.stringify(currencies ?? []);
  }

  async create(createProduct: CreateProductoDto, empresaId: number) {
    try {
      const currencyExist = await this.currencyRepo.findOne({
        where: { id: createProduct?.currency_id ?? 0 },
      });
      if (!currencyExist) {
        throw new BadRequestException({
          ok: false,
          statusCode: 400,
          message: 'No se encontro el currency seleccionado',
          error: 'Bad Request',
        });
      }

      const categories = await this.categoryRepo.find({
        where: { id: In(createProduct.categoryIds) },
      });
      if (
        createProduct.categoryIds &&
        categories.length !== createProduct.categoryIds.length
      ) {
        if (!createProduct?.isMenuDiario) {
          throw new BadRequestException({
            ok: false,
            statusCode: 400,
            message: 'Una o más categorías no fueron encontradas',
            error: 'Bad Request',
          });
        }
      }

      const product = new Producto();
      product.nombre = createProduct.nombre;
      product.precio = createProduct.precio;
      product.isMenuDiario = createProduct?.isMenuDiario ?? false;
      product.empresa_id = empresaId;
      product.descripcion = createProduct.descripcion;
      product.disponible = true;
      product.diaSemana = createProduct?.diaSemana ?? 1;
      product.orderMenuDiario = createProduct?.orderMenuDiario ?? 0;
      product.currency_id = currencyExist?.id;
      product.plazoDuracionEstimadoMinutos =
        createProduct.plazoDuracionEstimadoMinutos;
      if (categories?.length > 0) {
        product.category = categories;
      }

      if (createProduct.imagen) {
        product.imagen = createProduct.imagen;
      }

      const producto = this.productoRepository.create(product);
      await this.productoRepository.save(producto);

      return {
        ok: true,
        statusCode: 200,
        data: product,
      };
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
    return this.productoRepository.find({
      relations: ['category'],
      where: { isMenuDiario: true },
    });
  }

  async findAllWithQuery(data: GetProductsDTO): Promise<Producto[]> {
    const base: any = { disponible: true };

    if (data.query?.trim()) {
      base.nombre = ILike(`%${data.query.trim()}%`);
    }

    const products = await this.productoRepository.find({
      where: [
        { ...base, isMenuDiario: false },
        { ...base, isMenuDiario: IsNull() },
      ],
      relations: ['category'],
    });

    return products;
  }

  async findAllDailyMenu(data: GetProductsDTO): Promise<Producto[]> {
    const whereCondition: any = { disponible: true, isMenuDiario: true };

    if (data.query?.trim()) {
      whereCondition.nombre = ILike(`%${data.query.trim()}%`);
    }

    const products = await this.productoRepository.find({
      where: whereCondition,
      relations: ['category'],
    });

    return products;
  }

  async findOne(id: number) {
    try {
      const producto = await this.productoRepository.findOne({
        where: { id: id },
        relations: ['category'],
      });
      if (!producto) {
        throw new BadRequestException('El producto no existe');
      }
      return {
        ok: true,
        statusCode: 200,
        data: producto,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al encontrar el producto',
        error: 'Bad Request',
      });
    }
  }

  async findAllInTextDailyMenu(dayOfWeeK: number) {
    const productsAll = await this.productoRepository.find({
      where: {
        disponible: true,
        isMenuDiario: true,
        diaSemana: dayOfWeeK ?? 0,
      },
    });

    return productsAll.map((prod) => {
      return {
        name: prod?.nombre,
        id: prod?.id,
        disponible: prod?.disponible,
        price: prod?.precio,
        dayOfWeeK: dayOfWeeK,
        description: prod?.descripcion,
        plazoDuracionEstimado: prod?.plazoDuracionEstimadoMinutos,
        currency_id: prod?.currency_id,
      };
    });
  }

  async findAllInText(chatIdWhatsapp?: any) {
    const base = { disponible: true };

    const productsAll = await this.productoRepository.find({
      where: [
        { ...base, isMenuDiario: false },
        { ...base, isMenuDiario: IsNull() },
      ],
      relations: ['category'],
    });

    return productsAll.map((prod) => ({
      categories: prod.category?.map((cat) => cat?.name),
      name: prod?.nombre,
      id: prod?.id,
      disponible: prod?.disponible,
      price: prod?.precio,
      description: prod?.descripcion,
      plazoDuracionEstimado: prod?.plazoDuracionEstimadoMinutos,
      currency_id: prod?.currency_id,
    }))
  }

  async updateProducto(id: number, updateProductoDto: UpdateProductoDto) {
    try {
      const existProduct = await this.productoRepository.findOne({
        where: { id: id },
        relations: ['category'],
      });

      if (!existProduct) {
        throw new BadRequestException('El producto no existe');
      }
      for (const dato in existProduct) {
        if (updateProductoDto.hasOwnProperty(dato)) {
          existProduct[dato] = updateProductoDto[dato];
        }
      }
      const newCurrency = await this.currencyRepo.findOne({
        where: { id: updateProductoDto?.currency_id },
      });

      if (!newCurrency) {
        throw new BadRequestException('El Currency no existe');
      }
      if (!existProduct) {
        throw new BadRequestException('El producto no existe');
      }

      if (
        updateProductoDto.categoryIds &&
        updateProductoDto.categoryIds.length > 0
      ) {
        console.log('categoryIds', updateProductoDto?.categoryIds);
        const categories = await this.categoryRepo.find({
          where: { id: In([...updateProductoDto.categoryIds]) },
        });

        if (categories.length !== updateProductoDto.categoryIds.length) {
          throw new BadRequestException(
            'Una o más categorías no fueron encontradas',
          );
        }

        existProduct.category = categories;
      } else if (updateProductoDto?.categoryIds?.length === 0) {
        existProduct.category = [] as Category[];
      }
      existProduct.currency_id = newCurrency?.id;
      await this.productoRepository.save(existProduct);

      const updatedProduct = await this.productoRepository.findOne({
        where: { id: existProduct.id },
        relations: ['category'],
      });

      return {
        data: updatedProduct,
        statusCode: 200,
        ok: true,
        message: 'Producto actualizado correctamente',
      };
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
        relations: ['pedidosprod'],
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

  async actualizarPrecios(dto: UpdatePricesDto) {
    const {
      tipoActualizacion,
      valor,
      categoriaId,
      soloDisponibles = false,
    } = dto;

    if (tipoActualizacion === 'porcentaje' && (valor < 0 || valor > 100)) {
      throw new BadRequestException('El porcentaje debe estar entre 0 y 100');
    }

    const query = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.category', 'category');

    if (categoriaId) {
      query.where('category.id = :categoriaId', { categoriaId });
    }

    if (soloDisponibles) {
      query.andWhere('producto.disponible = true');
    }

    const productos = await query.getMany();

    for (const producto of productos) {
      const precioActual = Number(producto.precio);
      const valorNumerico = Number(valor);

      if (isNaN(precioActual) || isNaN(valorNumerico)) {
        throw new BadRequestException('Precio o valor inválido');
      }

      if (tipoActualizacion === 'porcentaje') {
        producto.precio = precioActual + precioActual * (valorNumerico / 100);
      } else {
        producto.precio = precioActual + valorNumerico;
      }

      await this.productoRepository.save(producto);
    }

    return {
      mensaje: 'Precios actualizados correctamente',
      ok: true,
    };
  }
}
