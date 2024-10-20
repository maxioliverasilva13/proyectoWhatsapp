import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany } from 'typeorm';

@Entity('productos')
export class Producto extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  precio: number;

  @Column()
  empresa_id: number;

  @Column()
  descripcion: string;

  @Column()
  plazoDuracionEstimadoMinutos: number;

  @Column()
  disponible: boolean;

  @OneToMany(() => ProductoPedido, (prod) => prod.producto)
  pedidosprod: ProductoPedido[];
}
