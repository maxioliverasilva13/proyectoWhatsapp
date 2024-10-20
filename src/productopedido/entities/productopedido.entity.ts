import { Pedido } from "src/pedido/entities/pedido.entity";
import { Producto } from "src/producto/entities/producto.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Entity, ManyToOne, PrimaryColumn } from "typeorm";

@Entity('productopedido')
export class ProductoPedido extends BaseEntity {
    @PrimaryColumn()
    productoId: number;
  
    @PrimaryColumn()
    pedidoId: number;

    @ManyToOne(() => Producto, (prod) => prod.pedidosprod)
    producto: Producto;

    @ManyToOne(() => Pedido, (ped) => ped.pedidosprod,)
    pedido: Pedido;
}
