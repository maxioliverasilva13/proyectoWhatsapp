import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany, ManyToMany, ManyToOne } from 'typeorm';

@Entity('currencies')
export class Currency extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;

  @Column()
  simbolo: string;

  @ManyToOne(()=> Empresa, (curr)=> curr.currencies)
  empresa : Empresa;
}