import { Estado } from "src/estado/entities/estado.entity";
import { Pedido } from "src/pedido/entities/pedido.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('cambioestadopedido')
export class Cambioestadopedido extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Pedido, (pedido) => pedido.cambioEstados)
    pedido: Pedido;

    @Column()
    id_user: string;

    @ManyToOne(() => Estado, (estado) => estado.cambioEstados)
    estado: Estado;
}
