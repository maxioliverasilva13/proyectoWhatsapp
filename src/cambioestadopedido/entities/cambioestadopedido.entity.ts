import { Estado } from "src/estado/entities/estado.entity";
import { Pedido } from "src/pedido/entities/pedido.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('cambioestadopedido')
export class Cambioestadopedido extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Pedido, (pedido) => pedido.cambioEstados, {onDelete:'CASCADE'})
    pedido: Pedido;

    @Column({ nullable: true, default: 0 })
    id_user: number;

    @ManyToOne(() => Estado, (estado) => estado.cambioEstados, {onDelete:'CASCADE'})
    estado: Estado;
}
