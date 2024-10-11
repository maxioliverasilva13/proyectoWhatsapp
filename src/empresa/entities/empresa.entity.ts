import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Length, IsNotEmpty } from 'class-validator';
import { Exclude } from 'class-transformer';

@Entity('empresa')
@Unique(['db_name'])
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  db_name: string;
}
