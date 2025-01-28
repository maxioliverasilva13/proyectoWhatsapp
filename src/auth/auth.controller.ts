import { Body, Controller, Get, Post, Req, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import { ResetPasswordDTO } from './dto/resetPassword.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Post('register')
  async register(@Body() userData: RegisterDTO, request) {
    return this.authService.register(userData);
  }

  @Get('me')
  async me(@Request() req, @Req() request : Request) {
    const timeZone = request['timeZone']
    return this.authService.currentUser(req?.user?.userId, timeZone);
  }

  @Post('login')
  async login(@Body() loginData: LoginDTO) {
    const user = await this.authService.validateUser(loginData.email, loginData.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordData: ResetPasswordDTO, @Request() req) {
    return this.authService.resetPassword(resetPasswordData.email);
  }
}
