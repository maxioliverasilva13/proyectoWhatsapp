import { Empresa } from 'src/empresa/entities/empresa.entity';
import { BaseEntity } from 'src/utils/base.entity';
import { Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne, OneToMany, OneToOne } from 'typeorm';

@Entity('payment')
@Unique(['purchaseToken'])
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  purchaseToken: string;

  @Column({ default: false })
  active: boolean;

  @Column({ nullable: false })
  started_by_user_id: string;

  @Column({ nullable: false })
  subscription_sku: string;

  @Column({ nullable: true })
  subscription_date: string;

  @Column({ nullable: true })
  package: string;

  @OneToOne(() => Empresa, emp => emp.payment, { onDelete: "CASCADE" })
  empresa: Empresa;

}
