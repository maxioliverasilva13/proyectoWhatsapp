import { Reclamo } from "src/pedido/entities/reclamo.entity";
import { BaseEntity } from "src/utils/base.entity";
import { PrimaryGeneratedColumn, Column, Entity, OneToMany } from "typeorm";

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

  @OneToMany(() => Reclamo, (reclamo) => reclamo.client)
  reclamos: Reclamo[];

}
