import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetToken } from '../users/entities/password-reset-token.entity';
import { User } from '../users/entities/user.entity';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../shared/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async createResetToken(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return; // Don't reveal if user exists

    await this.tokenRepository.update({ user: { id: user.id }, used: false }, { used: true });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    const resetToken = this.tokenRepository.create({
      token,
      expiresAt,
      user,
    });

    await this.tokenRepository.save(resetToken);

    // Send email
    await this.mailService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const resetToken = await this.tokenRepository.findOne({
      where: { token: dto.token },
      relations: ['user'],
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired token');
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(resetToken.user.id, {
      password: hashedPassword,
    });

    // Mark token as used
    await this.tokenRepository.update(resetToken.id, { used: true });
  }
}
