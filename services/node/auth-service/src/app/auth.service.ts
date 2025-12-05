import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  health() {
    return {
      status: 'ok',
      service: 'auth-service',
      provider: 'nestjs',
    };
  }

  async signup(dto: SignupDto) {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.usersRepository.findOne({ where: { email } });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      displayName: dto.displayName,
    });

    const persisted = await this.usersRepository.save(user);
    return this.buildAuthResponse(persisted);
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async validateToken(dto: ValidateTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.token);
      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });

      if (!user) {
        return { valid: false, reason: 'user_not_found' };
      }

      return {
        valid: true,
        user: this.sanitizeUser(user),
        payload,
      };
    } catch (error: any) {
      this.logger.warn(`Token validation failed: ${error?.message ?? 'unknown error'}`);
      return { valid: false, reason: 'invalid_token' };
    }
  }

  private async buildAuthResponse(user: User) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      expiresIn: this.configService.get<string>('jwt.expiresIn') ?? '23h',
      tokenType: 'Bearer',
      user: this.sanitizeUser(user),
    };
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}

