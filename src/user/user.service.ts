import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto, CreateUserProfileDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = bcrypt.hashSync(createUserDto.password, 12);

    return await this.prisma.user.create({
      data: { ...createUserDto, password: hashedPassword },
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
