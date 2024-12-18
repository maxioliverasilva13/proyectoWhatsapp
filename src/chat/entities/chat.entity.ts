import { Mensaje } from "src/mensaje/entities/mensaje.entity";
import { Pedido } from "src/pedido/entities/pedido.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('chat')
export class Chat extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    
    @OneToOne(() => Pedido, (pedido) => pedido.chat)
    pedido: Pedido;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date

    @OneToMany(() => Mensaje, (msg) => msg.chat)
    mensajes: Mensaje[];
}
