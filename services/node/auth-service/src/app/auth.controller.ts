import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return this.authService.health();
  }

  @Post('auth/signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('auth/validate')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() dto: ValidateTokenDto) {
    return this.authService.validateToken(dto);
  }
}

