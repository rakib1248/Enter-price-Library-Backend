import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SinginDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
    return {
      token,
      ...userData,
    };
  }
}
