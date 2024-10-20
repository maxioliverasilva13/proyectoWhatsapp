import { BaseEntity } from "src/utils/base.entity";
import { PrimaryGeneratedColumn, Column, Entity } from "typeorm";

@Entity('cliente')
export class Cliente extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empresa_id: number;

  @Column()
  nombre: string;

  @Column()
  telefono: string;

}
