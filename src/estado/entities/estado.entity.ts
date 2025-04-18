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

    @Column({ default: true })
    es_defecto: boolean;

    @Column({ default: false })
    finalizador: boolean;

    @Column({nullable: true})
    order: number;

    @OneToMany(() => Cambioestadopedido, (cmbe) => cmbe.estado, {onDelete:'CASCADE'})
    cambioEstados: Cambioestadopedido[];

    @Column()
    tipoServicioId: number;
}
