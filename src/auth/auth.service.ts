/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SinginDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async singIn(singinDto: SinginDto) {
    const userExist = await this.prisma.user.findFirst({
      where: { email: singinDto.email },
    });
    if (!userExist) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = bcrypt.compareSync(
      singinDto.password,
      userExist.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }
    const userData = {
      id: userExist.id,
      name: userExist.name,
      email: userExist.email,
      phone: userExist.phone,
      role: userExist.role,
    };
    const token = this.jwtService.sign(userData);
    const refreshToken = this.jwtService.sign(userData, {
      expiresIn: '7d', // Set the refresh token expiration time
    });
    await this.prisma.user.update({
      where: { id: userExist.id },
      data: { refreshToken },
    });

    return {
      token,

      ...userData,
    };
  }

  async forgotPassword(email: string) {
    const userExist = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!userExist) throw new BadGatewayException('this email user not fpound');
    // email verify
    const resetToken = this.jwtService.sign({ email }, { expiresIn: '30m' });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await this.mailService.sendResetEmail(email, resetLink);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(resetToken) as { email: string };

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await this.prisma.user.update({
        where: { email: payload.email },
        data: { password: hashedPassword },
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }
  async changePassword(passwort: string, newPassword: string, userId: string) {
    const userExist = await this.prisma.user.findFirst({
      where: { id: userId },
    });
    if (!userExist) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = bcrypt.compareSync(passwort, userExist.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: bcrypt.hashSync(newPassword, 12) },
    });
    return { message: 'Password changed successfully' };
  }
}
