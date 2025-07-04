import { Cambioestadopedido } from 'src/cambioestadopedido/entities/cambioestadopedido.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Cliente } from 'src/cliente/entities/cliente.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { PaymentMethod } from 'src/paymentMethod/entities/paymentMethod.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { BaseEntity } from 'src/utils/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pedido')
export class Pedido extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  confirmado: boolean;

  @Column({ default: false })
  withIA: boolean;

  @Column({ nullable: true, default: '' })
  reclamo: string;

  @OneToMany(() => Cambioestadopedido, (cmbe) => cmbe.pedido)
  cambioEstados: Cambioestadopedido[];

  @ManyToOne(() => Estado, (estado) => estado.pedidos, { onDelete: 'CASCADE' })
  estado: Estado;

  @ManyToOne(() => PaymentMethod, (pm) => pm.pedidos, { onDelete: 'CASCADE' })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  detalle_pedido: string;

  @Column({ nullable: true })
  chatIdWhatsapp: string;

  @Column({ nullable: true, default: '' })
  transferUrl: string;

  @Column()
  tipo_servicio_id: number;

  @Column({ nullable: true })
  cliente_id: number;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha: Date;

  @ManyToOne(() => Chat, (chat) => chat.pedido)
  @JoinColumn()
  chat: Chat;

  @OneToMany(() => ProductoPedido, (prod) => prod.pedido)
  pedidosprod: ProductoPedido[];

  @Column({ default: true })
  available: boolean;

  @Column({ default: false })
  notified: boolean;

  @Column({ default: false })
  finalizado: boolean;

  @Column({ nullable: true, length: 99999 })
  infoLinesJson: string;

  @Column({ nullable: true })
  owner_user_id: string;

  @ManyToOne(() => Cliente, (client) => client.pedido)
  client: Cliente;

  @Column({ nullable: true, default: true })
  isDomicilio: boolean;
}
