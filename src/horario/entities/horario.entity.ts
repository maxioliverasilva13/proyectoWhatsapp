import { Empresa } from "src/empresa/entities/empresa.entity";
import { Mensaje } from "src/mensaje/entities/mensaje.entity";
import { Pedido } from "src/pedido/entities/pedido.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('horario')
export class Horario extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    dayOfWeek: number;

    @Column({ type: 'time', nullable: false, default: null })
    hora_inicio: string;

    @Column({ type: 'time', nullable: false, default: null })
    hora_fin: string;

    @Column({ nullable: false, default: false })
    isDailyMenu: boolean;
}
