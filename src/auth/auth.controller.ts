import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SinginDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('singin')
  singIn(@Body() singinDto: SinginDto) {
    return this.authService.singIn(singinDto);
  }
}
