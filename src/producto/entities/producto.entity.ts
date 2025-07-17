import { Category } from 'src/category/entities/category.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity('productos')
export class Producto extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0,
  })
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

  @ManyToMany(() => Category, (cat) => cat.producto)
  @JoinTable()
  category: Category[];

  @Column({ default: null })
  isMenuDiario: boolean;

  @Column({ default: false, nullable: true })
  envioADomicilio: boolean;

  @Column({ default: false, nullable: true })
  retiroEnSucursal: boolean;

  @Column({ default: 0, nullable: true })
  orderMenuDiario: number;

  @Column({ default: 0, nullable: true })
  diaSemana: number;
}
