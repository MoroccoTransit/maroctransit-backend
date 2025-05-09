import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { roleName, ...userData } = createUserDto;

    const role = await this.rolesService.findByName(roleName);
    if (!role) {
      throw new BadRequestException(`Role '${roleName}' does not exist`);
    }

    const user = this.usersRepository.create({
      ...userData,
      role,
    });

    try {
      const savedUser = await this.usersRepository.save(user);
      const { password, ...result } = savedUser;
      return result;
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Email already exists');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
      select: ['id', 'email', 'password', 'role'],
    });
  }

  async findById(id: number): Promise<Omit<User, 'password'> | undefined> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }
}
