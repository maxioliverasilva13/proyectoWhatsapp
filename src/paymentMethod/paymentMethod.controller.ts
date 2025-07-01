import { Controller, Get, Put, Param, Body, Post } from '@nestjs/common';
import { PaymentMethodService } from './paymentMethod.service';
import { UpdatePaymentMethodDto } from './entities/dtos/update-payment-method.dto';
import { CreatePaymentMethodDto } from './entities/dtos/create-payment-method.dto';

@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  findAll() {
    return this.paymentMethodService.findAll();
  }

  @Get('/getAll')
  findAllPayments() {
    return this.paymentMethodService.findAllPayments();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.paymentMethodService.update(+id, dto);
  }

  @Post()
  create(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(dto);
  }
}
