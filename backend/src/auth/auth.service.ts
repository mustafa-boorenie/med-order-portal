import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // For demo purposes, we'll skip password verification
    // In production, you would verify the hashed password
    console.log(`🔐 Login attempt for user: ${email}`);

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        role: role || 'PATIENT',
      },
    });

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async verifyCheckoutToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== 'checkout') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Verify order exists and is in correct state
      const order = await this.prisma.order.findUnique({
        where: { id: payload.orderId },
      });

      if (!order) {
        throw new UnauthorizedException('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new UnauthorizedException('Order is not in pending status');
      }

      return {
        valid: true,
        orderId: payload.orderId,
        expiresAt: new Date(payload.exp * 1000),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async validateUser(payload: any): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (user) {
      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }
    return null;
  }

  async ssoUpsert(email: string, role?: 'ADMIN' | 'DOCTOR' | 'PATIENT') {
    const adminEmailsEnv = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const isEnvAdmin = adminEmailsEnv.includes(email.toLowerCase());
    const finalRole = role || (isEnvAdmin ? 'ADMIN' : 'PATIENT');

    const user = await this.prisma.user.upsert({
      where: { email },
      update: { role: finalRole },
      create: { email, role: finalRole },
    });

    return { id: user.id, email: user.email, role: user.role };
  }
}