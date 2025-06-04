import { Producto } from "src/producto/entities/producto.entity";
import { BaseEntity } from "src/utils/base.entity";

import { PrimaryGeneratedColumn, Column, Entity, OneToMany, ManyToMany } from "typeorm";

@Entity('category')
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  image: string;

  @ManyToMany(() => Producto, (prod) => prod.category)
  producto: Producto[];

  @Column({ default: true, nullable: true })
  enabled: boolean;
}
