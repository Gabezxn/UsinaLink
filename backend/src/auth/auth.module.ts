import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { MailerService } from './mailer.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [PasswordService, TokenService, JwtAuthGuard, AdminGuard, MailerService],
  exports: [PasswordService, TokenService, JwtAuthGuard, AdminGuard, MailerService],
})
export class AuthModule {}
