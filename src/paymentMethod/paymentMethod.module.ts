import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from './entities/paymentMethod.entity';
import { PaymentMethodService } from './paymentMethod.service';
import { PaymentMethodController } from './paymentMethod.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod])],
  providers: [PaymentMethodService],
  controllers: [PaymentMethodController],
})
export class PaymentMethodModule {}