import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppConfigService } from '../config/app-config.service.js';
import {
  AuthController,
  MeController,
  UsersController,
} from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CsrfGuard } from './csrf.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { MembershipService } from './membership.service.js';
import { SessionService } from './session.service.js';
import { SmsService } from './sms.service.js';
import { TokenService } from './token.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.env.JWT_ACCESS_SECRET,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 30,
      },
    ]),
  ],
  controllers: [AuthController, MeController, UsersController],
  providers: [
    AuthService,
    SmsService,
    SessionService,
    TokenService,
    MembershipService,
    JwtAuthGuard,
    CsrfGuard,
    ThrottlerGuard,
  ],
  exports: [
    JwtAuthGuard,
    CsrfGuard,
    TokenService,
    SessionService,
    MembershipService,
    AuthService,
  ],
})
export class AuthModule {}
