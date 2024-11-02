import { Injectable } from '@nestjs/common';
import { Producto } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
  ) {}

  async create(
    createProduct: CreateProductoDto,
    empresaId: number,
  ): Promise<Producto> {
    console.log(empresaId);
    
    const product = new Producto();
    product.nombre = createProduct.nombre;
    product.precio = createProduct.precio;
    product.empresa_id = empresaId;
    product.descripcion = createProduct.descripcion;
    product.plazoDuracionEstimadoMinutos = createProduct.plazoDuracionEstimadoMinutos;
    product.disponible = createProduct.disponible;
    const producto = this.productoRepository.create(product);
    return this.productoRepository.save(producto);
    }

  async findAll(): Promise<Producto[]> {
    return this.productoRepository.find();
  }

  async findAllInText() {
    const productsAll = await this.productoRepository.find();
    
    const productsFormated = productsAll.map((product) => {
      return `${product.id}-Procuto: ${product.nombre},Precio: ${product.precio}, Descripcion:${product.descripcion}$`;
    }).join(', '); 
  
    return productsFormated;
  }
}
