import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Producto } from 'src/producto/entities/producto.entity';
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

  @Column({nullable:true})
  image: string;

  @Column()
  descripcion: string;

  @Column()
  ubicacion: string;

  @Column({ nullable: true })
  capacidad: number;

  @OneToMany(()=> Pedido, (p)=> p.espacio)
  pedido: Pedido[]

  @OneToMany(() => Producto, (p) => p.espacio)
  producto: Producto[];
}
