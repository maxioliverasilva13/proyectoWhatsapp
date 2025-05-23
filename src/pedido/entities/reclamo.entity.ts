import { BaseEntity } from "src/utils/base.entity";
import { Column, Entity, ManyToOne, OneToOne, JoinColumn, PrimaryGeneratedColumn } from "typeorm";
import { Cliente } from "src/cliente/entities/cliente.entity";

@Entity('reclamo')
export class Reclamo extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.reclamos, { onDelete: 'CASCADE' })
  client: Cliente;

  @Column({ nullable: false, default: "" })
  texto: string;
}
