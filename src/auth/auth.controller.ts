import { Body, Controller, Get, Post, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Post('register')
  async register(@Body() userData: RegisterDTO) {
    return this.authService.register(userData);
  }

  @Get('me')
  async me(@Request() req) {
    return this.authService.currentUser(req?.user?.userId);
  }

  @Post('login')
  async login(@Body() loginData: LoginDTO) {
    const user = await this.authService.validateUser(loginData.email, loginData.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }
}
