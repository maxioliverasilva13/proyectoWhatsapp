import { Chat } from "src/chat/entities/chat.entity";
import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('mensaje')
export class Mensaje extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    mensaje: string;

    @Column({ default: false })
    isClient: boolean

    @Column({ default: false })
    isTool: boolean

    @Column({ nullable: true })
    tool_call_id: string

    @Column({ type: 'json', nullable: true })
    tool_calls: any;

    @Column({ type: 'timestamp with time zone', default: new Date() })
    time: Date

    @ManyToOne(() => Chat, (chat) => chat.mensajes)
    chat: Chat;
}

