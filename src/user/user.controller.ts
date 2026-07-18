import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, CreateUserProfileDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-user.dto';
import { CurrentUser } from './current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('otpsend')
  @UsePipes(new ValidationPipe())
  sendOtp(@Body() createUserDto: CreateUserDto) {
    return this.userService.createToken(createUserDto);
  }

  @Post()
  create(@Body() data: { token: string; otp: string }) {
    return this.userService.create(data.token, data.otp);
  }

  @Post('profile')
  @UsePipes(new ValidationPipe())
  createProfile(
    @Body() createProfileDto: CreateUserProfileDto,
    @CurrentUser() currentUser: { id: string },
  ) {
    return this.userService.createProfile(currentUser.id, createProfileDto);
  }

  @Get()
  // @UseGuards(JwtAuthGuard)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.update(id, updateProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
