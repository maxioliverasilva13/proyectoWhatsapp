import { Pedido } from "src/pedido/entities/pedido.entity";
import { Producto } from "src/producto/entities/producto.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";

@Entity('productopedido')
export class ProductoPedido extends BaseEntity {
    @PrimaryColumn()
    productoId: number;

    @PrimaryColumn()
    pedidoId: number;

    @Column()
    cantidad: number;

    @Column()
    precio: number;

    @Column({ nullable: true, default: null })
    detalle: string | null;

    @ManyToOne(() => Producto, (prod) => prod.pedidosprod)
    producto: Producto;

    @ManyToOne(() => Pedido, (ped) => ped.pedidosprod,)
    pedido: Pedido;
}
