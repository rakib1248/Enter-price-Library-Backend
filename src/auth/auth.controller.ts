import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SinginDto } from './dto/create-auth.dto';
import { CurrentUser } from '../user/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('singin')
  singIn(@Body() singinDto: SinginDto) {
    return this.authService.singIn(singinDto);
  }

  @Post('forgot-password')
  forgot(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Body('password') password: string,
    @Body('newPassword') newPassword: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.authService.changePassword(password, newPassword, user.userId);
  }
}
