import { Pedido } from 'src/pedido/entities/pedido.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  OneToMany,
} from 'typeorm';

@Entity('espacio')
export class Espacio extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @Column()
  ubicacion: string;

  @Column({ nullable: true })
  capacidad: number;

  @OneToMany(()=> Pedido, (p)=> p.espacio)
  pedido: Pedido[]
}
