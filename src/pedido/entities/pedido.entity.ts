import { Cambioestadopedido } from "src/cambioestadopedido/entities/cambioestadopedido.entity";
import { Chat } from "src/chat/entities/chat.entity";
import { Estado } from "src/estado/entities/estado.entity";
import { ProductoPedido } from "src/productopedido/entities/productopedido.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('pedido')
export class Pedido extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    confirmado: boolean;

    @OneToMany(() => Cambioestadopedido, (cmbe) => cmbe.pedido)
    cambioEstados: Cambioestadopedido[];

    @ManyToOne(() => Estado, (estado) => estado.pedidos)
    estado: Estado;

    @Column({ nullable: true })
    fecha_calendario: Date;

    @Column({ nullable: true })
    detalle_pedido: Date;

    @Column()
    tipo_servicio_id: number;

    @Column()
    cliente_id: number;

    @OneToOne(() => Chat, (chat) => chat.pedido)
    chat: Chat;

    @OneToMany(() => ProductoPedido, (prod) => prod.pedido)
    pedidosprod: ProductoPedido[];
}
