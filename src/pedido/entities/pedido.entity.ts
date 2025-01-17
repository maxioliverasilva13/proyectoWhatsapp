import { Cambioestadopedido } from "src/cambioestadopedido/entities/cambioestadopedido.entity";
import { Chat } from "src/chat/entities/chat.entity";
import { Estado } from "src/estado/entities/estado.entity";
import { ProductoPedido } from "src/productopedido/entities/productopedido.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('pedido')
export class Pedido extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: false })
    confirmado: boolean;

    @OneToMany(() => Cambioestadopedido, (cmbe) => cmbe.pedido)
    cambioEstados: Cambioestadopedido[];

    @ManyToOne(() => Estado, (estado) => estado.pedidos)
    estado: Estado;

    @Column({ nullable: true })
    detalle_pedido: string;

    @Column()
    tipo_servicio_id: number;

    @Column({ nullable: true })
    cliente_id: number;

    @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    fecha : Date

    @OneToOne(() => Chat, (chat) => chat.pedido)
    @JoinColumn()
    chat: Chat;

    @OneToMany(() => ProductoPedido, (prod) => prod.pedido)
    pedidosprod: ProductoPedido[];

    @Column({default:true})
    available : boolean

    @Column({ nullable: true, length: 99999 })
    infoLinesJson: string;

}
