import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/login")
  login(
    @Req() request: Request,
    @Body() loginRequestDto: LoginRequestDto,
  ) {
    const empresaId = request['empresaId'];
    return this.authService.login(empresaId,loginRequestDto);
  }
}
