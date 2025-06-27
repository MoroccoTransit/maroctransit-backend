import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordResetService } from './password-reset.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetToken } from 'src/users/entities/password-reset-token.entity';
import { User } from 'src/users/entities/user.entity';
import { MailModule } from 'src/shared/mail/mail-upload.service';
import { RolesGuard } from './guards/roles.gaurd';
import { WsJwtGuard } from './guards/ws-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([PasswordResetToken, User]),
    PassportModule,
    UsersModule,
    MailModule,
    RolesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    PasswordResetService,
    LocalStrategy,
    JwtStrategy,
    RolesGuard,
    WsJwtGuard,
  ],
  controllers: [AuthController],
  exports: [RolesGuard],
})
export class AuthModule {}
