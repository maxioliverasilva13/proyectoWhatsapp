import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
