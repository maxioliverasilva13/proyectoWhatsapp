import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

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
