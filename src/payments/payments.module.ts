import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Payment } from './payment.entity';
import { PaymentsController } from './payments.controller';
import { Plan } from 'src/plan/entities/plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Empresa, Usuario, Plan])],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
