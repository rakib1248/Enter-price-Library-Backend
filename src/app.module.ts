import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { BookModule } from './book/book.module';
import { UserModule } from './user/user.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/global-error.handelar';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { ResendModule } from './resend/resend.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    AuthModule,

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    BookModule,
    UserModule,
    ResendModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    MailService,
  ],
})
export class AppModule {}
