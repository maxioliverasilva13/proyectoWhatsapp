import { Producto } from "src/producto/entities/producto.entity";
import { BaseEntity } from "src/utils/base.entity";
import { PrimaryGeneratedColumn, Column, Entity, OneToMany } from "typeorm";

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

  @OneToMany(()=> Producto, (prod) => prod.category )
  producto: Producto[]

}
