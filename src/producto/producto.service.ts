import { Injectable } from '@nestjs/common';
import { TenantConnectionService } from 'src/tenant-connection-service/tenant-connection-service.service';
import { Producto } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';

@Injectable()
export class ProductoService {
  constructor(private tenantConnectionService: TenantConnectionService) {}

  async create(
    createProduct: CreateProductoDto,
    empresaId: number,
  ): Promise<Producto> {
    const connection =
      await this.tenantConnectionService.getConnectionByEmpresa(empresaId);
    const productoRepository = connection.getRepository(Producto);

    const product = new Producto();
    product.nombre = createProduct.nombre;
    product.precio = createProduct.precio;
    product.empresa_id = empresaId;
    const producto = productoRepository.create(product);
    return productoRepository.save(producto);
  }

  async findAll(empresaId: number): Promise<Producto[]> {
    const connection =
      await this.tenantConnectionService.getConnectionByEmpresa(empresaId);
    const productoRepository = connection.getRepository(Producto);

    return productoRepository.find();
  }
}
