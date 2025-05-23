import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, ManyToOne, OneToOne, JoinColumn, PrimaryGeneratedColumn } from "typeorm";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Cliente } from "src/cliente/entities/cliente.entity";
import { Pedido } from "src/pedido/entities/pedido.entity";

@Entity('reclamo')
export class Reclamo extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.reclamos, { onDelete: 'CASCADE' })
  client: Cliente;

  @OneToOne(() => Pedido, { onDelete: 'CASCADE' })
  @JoinColumn()
  pedido: Pedido;

  @Column({ nullable: false, default: "" })
  texto: string;
}
