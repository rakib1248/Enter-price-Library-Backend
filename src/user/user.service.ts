/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto, CreateUserProfileDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    readonly prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async createToken(cretaeUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: cretaeUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = bcrypt.hashSync(cretaeUserDto.password, 12);

    await this.mailService.sendOtp(cretaeUserDto.email, otpCode);

    const token = this.jwtService.sign(
      { ...cretaeUserDto, otp: otpCode, password: hashedPassword },
      { expiresIn: '5m' },
    );

    return { token };
  }

  async create(token: string, otp: string) {
    const createUserDto = this.jwtService.verify(token) as CreateUserDto;

    if (!createUserDto) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (createUserDto.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    return await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: createUserDto.password,
      },
    });
  }

  async createProfile(userId: string, profileData: CreateUserProfileDto) {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Profile for this user already exists');
    }

    return await this.prisma.profile.create({
      data: { ...profileData, userId },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({ include: { profile: true } });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!existingProfile) {
      throw new BadRequestException('Profile for this user does not exist');
    }

    return this.prisma.profile.update({
      where: { userId: id },
      data: updateProfileDto,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
