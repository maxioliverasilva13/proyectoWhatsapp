import { Currency } from 'src/currencies/entities/currency.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany, ManyToOne } from 'typeorm';

@Entity('productos')
export class Producto extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio: number;

  @Column({ nullable: true })
  imagen: string;

  @Column()
  empresa_id: number;

  @Column()
  descripcion: string;

  @Column()
  plazoDuracionEstimadoMinutos: number;

  @Column()
  disponible: boolean;

  @Column({ default: null })
  currency_id: number;

  @OneToMany(() => ProductoPedido, (prod) => prod.producto)
  pedidosprod: ProductoPedido[];
}
