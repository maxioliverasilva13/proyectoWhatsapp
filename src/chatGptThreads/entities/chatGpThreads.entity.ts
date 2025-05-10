import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("chatGptThreads")
export class ChatGptThreads extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'bigint' })
    numberPhone: string; 

    @Column()
    threadId: string;

    @Column({nullable : true})
    chatId: string;

    @Column({nullable : true, default: null})
    originalChatId: string;

    @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    last_update: Date;

    @Column({ default: false })
    sesionStatus: boolean;

}