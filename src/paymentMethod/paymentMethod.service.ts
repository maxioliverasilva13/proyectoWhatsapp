import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/paymentMethod.entity';
import { UpdatePaymentMethodDto } from './entities/dtos/update-payment-method.dto';
import { CreatePaymentMethodDto } from './entities/dtos/create-payment-method.dto';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  findAll(): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({where:{enabled:true}});
  }

  async update(id: number, dto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    await this.paymentMethodRepository.update(id, dto);
    return this.paymentMethodRepository.findOneBy({ id });
  }

  create(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const paymentMethod = this.paymentMethodRepository.create(dto);
    return this.paymentMethodRepository.save(paymentMethod);
  }
}
