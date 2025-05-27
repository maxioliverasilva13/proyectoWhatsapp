import { Mensaje } from "src/mensaje/entities/mensaje.entity";
import { Pedido } from "src/pedido/entities/pedido.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('paymentMethod')
export class PaymentMethod extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, default: true })
    enabled: boolean;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: true, default: "" })
    description: string;

    @Column({ nullable: true, default: "" })
    specifications: string;
    
    @OneToMany(() => Pedido, (pedido) => pedido.paymentMethod)
    pedidos: Pedido[];

    @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
