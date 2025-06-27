import { Body, Controller, Post, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CarrierRegisterDto } from '../users/dto/create-carrier.dto';
import { ShipperRegisterDto } from '../users/dto/create-shipper.dto';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { multerConfig } from 'src/shared/file-upload/config/multer.config';
import { PasswordResetService } from './password-reset.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('register/carrier')
  async registerCarrier(@Body() carrierDto: CarrierRegisterDto) {
    const user = await this.userService.registerCarrier(carrierDto);
    return { message: 'Carrier registered successfully', userId: user.id };
  }

  @Post('register/shipper')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'companyRegistrationDoc', maxCount: 1 }], multerConfig),
  )
  async registerShipper(
    @UploadedFiles()
    files: {
      companyRegistrationDoc?: Express.Multer.File[];
    },
    @Body() shipperDto: ShipperRegisterDto,
  ) {
    if (!files.companyRegistrationDoc?.[0]) {
      throw new BadRequestException('All document files are required');
    }
    const filePaths = {
      companyRegistrationDocPath: files.companyRegistrationDoc?.[0]?.filename,
    };
    const user = await this.userService.registerShipper(shipperDto, filePaths);
    return { message: 'Shipper registration pending admin approval', userId: user.id };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body(new ValidationPipe()) loginDto: LoginUserDto) {
    return this.authService.login(req.user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.passwordResetService.createResetToken(dto.email);
    return { message: 'Password reset instructions sent to email' };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(dto);
    return { message: 'Password reset successful' };
  }
}
