import { Cambioestadopedido } from "src/cambioestadopedido/entities/cambioestadopedido.entity";
import { Pedido } from "src/pedido/entities/pedido.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('estado')
export class Estado extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    es_defecto: boolean;

    @OneToMany(() => Cambioestadopedido, (cmbe) => cmbe.estado)
    cambioEstados: Cambioestadopedido[];


    @OneToMany(() => Pedido, (pedido) => pedido.estado)
    pedidos: Pedido[];

    @Column()
    tipoServicioId: boolean;
}
